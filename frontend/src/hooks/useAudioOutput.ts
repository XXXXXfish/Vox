import { useState, useRef, useCallback } from 'react';

interface UseAudioOutputReturn {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  playAudioStream: (stream: MediaStream) => void;
  stopAudio: () => void;
}

export const useAudioOutput = (): UseAudioOutputReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  const playAudioStream = useCallback((stream: MediaStream) => {
    try {
      // 停止当前播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.srcObject = null;
      }

      // 创建新的音频元素
      const audio = new Audio();
      audioRef.current = audio;
      streamRef.current = stream;

      // 设置音频流
      audio.srcObject = stream;
      audio.volume = isMuted ? 0 : volume;
      audio.autoplay = true;

      // 设置事件监听器
      audio.addEventListener('play', () => {
        setIsPlaying(true);
      });

      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('error', (e) => {
        console.error('音频播放错误:', e);
        setIsPlaying(false);
      });

      // 开始播放
      audio.play().catch(error => {
        console.error('音频播放失败:', error);
        setIsPlaying(false);
      });

    } catch (error) {
      console.error('设置音频流失败:', error);
      setIsPlaying(false);
    }
  }, [volume, isMuted]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      setIsPlaying(false);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
  }, []);

  return {
    isPlaying,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    playAudioStream,
    stopAudio,
  };
};
