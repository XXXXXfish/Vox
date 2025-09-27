import React, { useEffect, useRef } from 'react';
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';
import type { ChatMessage as ChatMessageType, Role } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  selectedRole: Role | null;
  isLoading: boolean;
  error: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  selectedRole,
  isLoading,
  error
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!selectedRole) {
    return (
      <div className="card h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>请先选择一个角色开始对话</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card h-96 flex flex-col">
      {/* 聊天头部 */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
          {selectedRole.avatar_url ? (
            <img
              src={selectedRole.avatar_url}
              alt={selectedRole.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-medium">
              {selectedRole.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{selectedRole.name}</h3>
          <p className="text-sm text-gray-500">AI 角色扮演</p>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-1">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">开始与 {selectedRole.name} 对话吧</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                roleAvatar={selectedRole.avatar_url}
              />
            ))}
            
            {/* 加载状态 */}
            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {selectedRole.avatar_url ? (
                    <img
                      src={selectedRole.avatar_url}
                      alt={selectedRole.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {selectedRole.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                    <span className="text-sm text-gray-600">AI 正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 错误状态 */}
            {error && (
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="bg-red-50 rounded-2xl rounded-bl-md px-4 py-3 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatInterface;
