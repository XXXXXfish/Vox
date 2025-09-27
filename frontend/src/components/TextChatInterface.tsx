import React, { useEffect, useRef } from 'react';
import { MessageSquare, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import ChatMessage from './ChatMessage';
import TextChatInput from './TextChatInput';
import type { ChatMessage as ChatMessageType, Role } from '../types';

interface TextChatInterfaceProps {
  messages: ChatMessageType[];
  selectedRole: Role | null;
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onClearMessages: () => void;
  onRetry: () => void;
}

const TextChatInterface: React.FC<TextChatInterfaceProps> = ({
  messages,
  selectedRole,
  isLoading,
  error,
  onSendMessage,
  onClearMessages,
  onRetry
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
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
        <div className="flex items-center gap-3">
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
            <p className="text-sm text-gray-500">文字对话</p>
          </div>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={onClearMessages}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="清空对话"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-1 mb-4">
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
                <div className="bg-red-50 rounded-2xl rounded-bl-md px-4 py-3 border border-red-200 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                      onClick={onRetry}
                      className="ml-2 text-red-600 hover:text-red-800"
                      title="重试"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <TextChatInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        disabled={!!error}
        placeholder={`与 ${selectedRole.name} 对话...`}
      />
    </div>
  );
};

export default TextChatInterface;
