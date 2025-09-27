import { useState, useRef, useCallback } from 'react';

interface UseAudioStreamReturn {
  isStreaming: boolean;
  stream: MediaStream | null;
  startStream: () => Promise<void>;
  stopStream: () => void;
  error: string | null;
}

export const useAudioStream = (): UseAudioStreamReturn => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startStream = useCallback(async () => {
    try {
      setError(null);
      
      // 请求麦克风权限
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // 降低采样率以减少带宽
          channelCount: 1,   // 单声道
        } 
      });

      streamRef.current = audioStream;
      setStream(audioStream);
      setIsStreaming(true);
      
    } catch (err) {
      console.error('音频流启动失败:', err);
      setError('无法访问麦克风，请检查权限设置');
      setIsStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    stream,
    startStream,
    stopStream,
    error,
  };
};
