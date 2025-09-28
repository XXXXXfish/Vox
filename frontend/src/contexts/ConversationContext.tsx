import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types';

// 对话记录类型
export interface ConversationRecord {
  roleId: string;
  messages: ChatMessage[];
  lastUpdated: number;
  sessionId?: string;
}

// Context 状态类型
interface ConversationContextState {
  conversations: Record<string, ConversationRecord>;
  getConversation: (roleId: string) => ConversationRecord;
  addMessage: (roleId: string, message: ChatMessage) => void;
  clearConversation: (roleId: string) => void;
  setSessionId: (roleId: string, sessionId: string) => void;
}

// 创建 Context
const ConversationContext = createContext<ConversationContextState | undefined>(undefined);

// 本地存储键名
const STORAGE_KEY = 'vox_conversations';

// Provider 组件
export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Record<string, ConversationRecord>>({});

  // 从本地存储加载对话记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedConversations = JSON.parse(saved);
        setConversations(parsedConversations);
      }
    } catch (error) {
      console.error('加载本地对话记录失败:', error);
    }
  }, []);

  // 保存对话记录到本地存储
  const saveToStorage = useCallback((newConversations: Record<string, ConversationRecord>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConversations));
    } catch (error) {
      console.error('保存对话记录到本地存储失败:', error);
    }
  }, []);

  // 获取指定角色的对话记录
  const getConversation = useCallback((roleId: string): ConversationRecord => {
    return conversations[roleId] || {
      roleId,
      messages: [],
      lastUpdated: Date.now(),
    };
  }, [conversations]);

  // 添加消息到指定角色的对话记录
  const addMessage = useCallback((roleId: string, message: ChatMessage) => {
    setConversations(prev => {
      const newConversations = {
        ...prev,
        [roleId]: {
          ...prev[roleId],
          roleId,
          messages: [...(prev[roleId]?.messages || []), message],
          lastUpdated: Date.now(),
          sessionId: prev[roleId]?.sessionId || message.session_id,
        },
      };
      
      // 保存到本地存储
      saveToStorage(newConversations);
      
      return newConversations;
    });
  }, [saveToStorage]);

  // 清空指定角色的对话记录
  const clearConversation = useCallback((roleId: string) => {
    setConversations(prev => {
      const newConversations = {
        ...prev,
        [roleId]: {
          roleId,
          messages: [],
          lastUpdated: Date.now(),
        },
      };
      
      // 保存到本地存储
      saveToStorage(newConversations);
      
      return newConversations;
    });
  }, [saveToStorage]);

  // 设置会话ID
  const setSessionId = useCallback((roleId: string, sessionId: string) => {
    setConversations(prev => {
      const newConversations = {
        ...prev,
        [roleId]: {
          ...prev[roleId],
          roleId,
          messages: prev[roleId]?.messages || [],
          lastUpdated: Date.now(),
          sessionId,
        },
      };
      
      // 保存到本地存储
      saveToStorage(newConversations);
      
      return newConversations;
    });
  }, [saveToStorage]);

  const value: ConversationContextState = {
    conversations,
    getConversation,
    addMessage,
    clearConversation,
    setSessionId,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

// Hook 用于使用 Context
export const useConversationContext = (): ConversationContextState => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversationContext must be used within a ConversationProvider');
  }
  return context;
};