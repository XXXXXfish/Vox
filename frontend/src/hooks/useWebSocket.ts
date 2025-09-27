import { useState, useRef, useCallback, useEffect } from 'react';

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (url: string) => void;
  disconnect: () => void;
  sendAudioChunk: (audioData: ArrayBuffer) => void;
  onAudioData: (callback: (audioData: ArrayBuffer) => void) => void;
  onMessage: (callback: (message: any) => void) => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioDataCallbackRef = useRef<((audioData: ArrayBuffer) => void) | null>(null);
  const messageCallbackRef = useRef<((message: any) => void) | null>(null);

  const connect = useCallback((url: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        console.log('WebSocket 连接已建立');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        console.log('WebSocket 连接已关闭');
      };

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        setError('WebSocket 连接错误');
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          if (event.data instanceof ArrayBuffer) {
            // 音频数据
            if (audioDataCallbackRef.current) {
              audioDataCallbackRef.current(event.data);
            }
          } else {
            // 文本消息
            const message = JSON.parse(event.data);
            if (messageCallbackRef.current) {
              messageCallbackRef.current(message);
            }
          }
        } catch (err) {
          console.error('处理 WebSocket 消息失败:', err);
        }
      };

    } catch (err) {
      console.error('创建 WebSocket 连接失败:', err);
      setError('无法创建 WebSocket 连接');
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendAudioChunk = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioData);
    } else {
      console.warn('WebSocket 未连接，无法发送音频数据');
    }
  }, []);

  const onAudioData = useCallback((callback: (audioData: ArrayBuffer) => void) => {
    audioDataCallbackRef.current = callback;
  }, []);

  const onMessage = useCallback((callback: (message: any) => void) => {
    messageCallbackRef.current = callback;
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendAudioChunk,
    onAudioData,
    onMessage,
  };
};
