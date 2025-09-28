import { useState, useCallback } from 'react';
import { sendTextMessage } from '../services/api';
import { useConversationContext } from '../contexts/ConversationContext';
import type { ChatMessage, Role, ChatResponse } from '../types';

interface UseTextChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  sendTextMessage: (message: string, role: Role) => Promise<void>;
  addDirectMessage: (message: ChatMessage, roleId: string) => void; // 新增：直接添加消息
  loadConversation: (roleId: string) => void;
  clearError: () => void;
  clearMessages: (roleId: string) => void;
}

export const useTextChat = (): UseTextChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { getConversation, addMessage, clearConversation, setSessionId: setContextSessionId } = useConversationContext();

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

      // 添加到全局状态和本地显示
      addMessage(role.ID, userMessage);
      setMessages((prev: ChatMessage[]) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return [...prevArray, userMessage];
      });

      // 发送文字消息到后端
      const response: ChatResponse = await sendTextMessage(
        role.ID,
        message
      );

      // 更新会话ID
      if (response.session_id) {
        setSessionId(response.session_id);
        setContextSessionId(role.ID, response.session_id);
      }

      // 添加AI回复消息
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'ai',
        text: response.response || response.ai_response_text || '',
        audio_url: response.ai_audio_url,
        timestamp: Date.now(),
        session_id: response.session_id
      };

      // 添加到全局状态和本地显示
      addMessage(role.ID, aiMessage);
      setMessages((prev: ChatMessage[]) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return [...prevArray, aiMessage];
      });

    } catch (err) {
      console.error('发送文字消息失败:', err);
      setError(err instanceof Error ? err.message : '发送消息失败');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, addMessage, setContextSessionId]);

  const loadConversation = useCallback((roleId: string) => {
    try {
      setError(null);
      
      // 从全局状态获取对话记录
      const conversation = getConversation(roleId);
      setMessages(conversation.messages);
      
      // 设置会话ID
      if (conversation.sessionId) {
        setSessionId(conversation.sessionId);
      }
    } catch (err) {
      console.error('加载对话记录失败:', err);
      setError(err instanceof Error ? err.message : '加载对话记录失败');
    }
  }, [getConversation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearMessages = useCallback((roleId: string) => {
    // 清空全局状态中的对话记录
    clearConversation(roleId);
    // 清空本地显示
    setMessages([]);
    setSessionId(null);
  }, [clearConversation]);

  // 直接添加消息（用于语音处理等场景）
  const addDirectMessage = useCallback((message: ChatMessage, roleId: string) => {
    // 添加到全局状态
    addMessage(roleId, message);
    // 添加到本地显示
    setMessages((prev: ChatMessage[]) => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return [...prevArray, message];
    });
  }, [addMessage]);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendTextMessage: sendTextMessageHandler,
    addDirectMessage,
    loadConversation,
    clearError,
    clearMessages,
  };
};
