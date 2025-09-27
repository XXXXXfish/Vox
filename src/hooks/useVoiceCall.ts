import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioStream } from './useAudioRecorder';
import { useAudioOutput } from './useAudioOutput';
import { useWebSocket } from './useWebSocket';
import type { Role } from '../types';

export type CallState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseVoiceCallReturn {
  callState: CallState;
  isMuted: boolean;
  volume: number;
  startCall: (role: Role) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  error: string | null;
}

export const useVoiceCall = (): UseVoiceCallReturn => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const { isStreaming, stream, startStream, stopStream, error: streamError } = useAudioStream();
  const { volume, isMuted, setVolume, toggleMute, playAudioStream, stopAudio } = useAudioOutput();
  const { isConnected, isConnecting, error: wsError, connect, disconnect, sendAudioChunk, onAudioData, onMessage } = useWebSocket();
  
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 处理音频流数据
  const setupAudioProcessing = useCallback(async () => {
    if (!stream) return;

    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (callState === 'connected' && !isMuted) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);
          
          // 转换为 ArrayBuffer
          const audioData = new ArrayBuffer(inputData.length * 2);
          const view = new DataView(audioData);
          
          for (let i = 0; i < inputData.length; i++) {
            const sample = Math.max(-1, Math.min(1, inputData[i]));
            view.setInt16(i * 2, sample * 0x7FFF, true);
          }
          
          sendAudioChunk(audioData);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      
    } catch (err) {
      console.error('设置音频处理失败:', err);
      setError('音频处理初始化失败');
    }
  }, [stream, callState, isMuted, sendAudioChunk]);

  // 处理接收到的音频数据
  const handleReceivedAudio = useCallback(async (audioData: ArrayBuffer) => {
    try {
      // 创建音频流
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      
      // 创建媒体流
      const destination = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(destination);
      source.start();
      
      // 播放音频
      playAudioStream(destination.stream);
      
    } catch (err) {
      console.error('播放接收到的音频失败:', err);
    }
  }, [playAudioStream]);

  // 处理WebSocket消息
  const handleMessage = useCallback((message: any) => {
    console.log('收到消息:', message);
    // 处理来自后端的消息，比如通话状态更新等
  }, []);

  // 设置WebSocket回调
  useEffect(() => {
    onAudioData(handleReceivedAudio);
    onMessage(handleMessage);
  }, [onAudioData, onMessage, handleReceivedAudio]);

  // 开始通话
  const startCall = useCallback(async (role: Role) => {
    try {
      setCallState('connecting');
      setError(null);

      // 启动音频流
      await startStream();
      
      // 连接到WebSocket
      const wsUrl = `${import.meta.env.VITE_API_BASE_URL || 'ws://localhost:8000'}/ws/voice-call/${role.id}`;
      connect(wsUrl);

    } catch (err) {
      console.error('启动通话失败:', err);
      setError('启动通话失败');
      setCallState('error');
    }
  }, [startStream, connect]);

  // 结束通话
  const endCall = useCallback(() => {
    // 停止音频流
    stopStream();
    
    // 停止音频播放
    stopAudio();
    
    // 断开WebSocket
    disconnect();
    
    // 清理音频处理
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setCallState('idle');
  }, [stopStream, stopAudio, disconnect]);

  // 监听连接状态变化
  useEffect(() => {
    if (isConnected && callState === 'connecting') {
      setCallState('connected');
    } else if (!isConnected && !isConnecting && callState === 'connected') {
      setCallState('disconnected');
    }
  }, [isConnected, isConnecting, callState]);

  // 监听音频流状态
  useEffect(() => {
    if (isStreaming && callState === 'connected') {
      setupAudioProcessing();
    }
  }, [isStreaming, callState, setupAudioProcessing]);

  // 监听错误状态
  useEffect(() => {
    if (streamError) {
      setError(streamError);
      setCallState('error');
    }
  }, [streamError]);

  useEffect(() => {
    if (wsError) {
      setError(wsError);
      setCallState('error');
    }
  }, [wsError]);

  return {
    callState,
    isMuted,
    volume,
    startCall,
    endCall,
    toggleMute,
    setVolume,
    error,
  };
};
