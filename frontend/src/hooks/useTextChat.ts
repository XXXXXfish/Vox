import { useState, useCallback } from 'react';
import { sendTextMessage, fetchChatHistory } from '../services/api';
import type { ChatMessage, Role, ChatResponse } from '../types';

interface UseTextChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  sendTextMessage: (message: string, role: Role) => Promise<void>;
  loadHistory: (roleId: string) => Promise<void>;
  clearError: () => void;
  clearMessages: () => void;
}

export const useTextChat = (): UseTextChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sendTextMessageHandler = useCallback(async (message: string, role: Role) => {
    try {
      setIsLoading(true);
      setError(null);

      // 添加用户消息
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        speaker: 'user',
        text: message,
        timestamp: Date.now(),
        session_id: sessionId || 'new-session'
      };

      setMessages((prev: ChatMessage[]) => [...prev, userMessage]);

      // 发送文字消息到后端
      const response: ChatResponse = await sendTextMessage(
        role.ID,
        message
      );

      // 更新会话ID
      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // 添加AI回复消息
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'ai',
        text: response.ai_response_text,
        audio_url: response.ai_audio_url,
        timestamp: Date.now(),
        session_id: response.session_id
      };

      setMessages((prev: ChatMessage[]) => [...prev, aiMessage]);

    } catch (err) {
      console.error('发送文字消息失败:', err);
      setError(err instanceof Error ? err.message : '发送消息失败');
      
      // 移除用户消息
      setMessages((prev: ChatMessage[]) => prev.filter((msg: ChatMessage) => msg.speaker !== 'user' || msg.text !== message));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const loadHistory = useCallback(async (roleId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const history = await fetchChatHistory(roleId);
      setMessages(history);
      
      // 从历史消息中获取最新的会话ID
      if (history.length > 0) {
        const latestMessage = history[history.length - 1];
        setSessionId(latestMessage.session_id);
      }
    } catch (err) {
      console.error('加载历史记录失败:', err);
      setError(err instanceof Error ? err.message : '加载历史记录失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendTextMessage: sendTextMessageHandler,
    loadHistory,
    clearError,
    clearMessages,
  };
};
