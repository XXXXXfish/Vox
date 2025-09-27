import { useState, useRef, useCallback } from 'react';
import type { PlaybackState } from '../types';

interface UseAudioPlayerReturn {
  playbackState: PlaybackState;
  play: (audioUrl: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  currentTime: number;
  duration: number;
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (audioUrl: string) => {
    try {
      // 如果已有音频在播放，先停止
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // 创建新的音频元素
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // 设置事件监听器
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setPlaybackState('idle');
        setCurrentTime(0);
      });

      audio.addEventListener('error', (e) => {
        console.error('音频播放错误:', e);
        setPlaybackState('idle');
      });

      // 开始播放
      await audio.play();
      setPlaybackState('playing');
      
    } catch (error) {
      console.error('音频播放失败:', error);
      setPlaybackState('idle');
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && playbackState === 'playing') {
      audioRef.current.pause();
      setPlaybackState('paused');
    }
  }, [playbackState]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaybackState('idle');
      setCurrentTime(0);
    }
  }, []);

  return {
    playbackState,
    play,
    pause,
    stop,
    currentTime,
    duration,
  };
};
