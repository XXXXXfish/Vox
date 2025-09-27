import React, { useEffect, useRef } from 'react';
import { MessageSquare, Loader2, AlertCircle, ChevronRight, MoreHorizontal } from 'lucide-react';
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
      <div className="chat-area flex items-center justify-center">
        <div className="text-center transition-colors duration-200 dark:text-gray-500 light:text-gray-600">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 transition-colors duration-200 dark:text-gray-600 light:text-gray-400" />
          <p className="text-lg">请先选择一个角色开始对话</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b transition-colors duration-200 dark:border-gray-700 light:border-gray-200 dark:bg-gray-800 light:bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden transition-colors duration-200 dark:bg-gray-700 light:bg-gray-100 flex items-center justify-center">
            {selectedRole.avatar_url ? (
              <img
                src={selectedRole.avatar_url}
                alt={selectedRole.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium transition-colors duration-200 dark:text-gray-300 light:text-gray-600">
                {selectedRole.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-medium transition-colors duration-200 dark:text-white light:text-gray-900">{selectedRole.name}</h3>
            <p className="text-sm transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
              {isLoading ? '正在输入...' : '在线'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={onClearMessages}
              className="p-2 transition-colors duration-200 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-gray-700 light:hover:bg-gray-100 rounded-md"
              title="清空对话"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
          <button className="p-2 transition-colors duration-200 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-gray-700 light:hover:bg-gray-100 rounded-md">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center transition-colors duration-200 dark:text-gray-500 light:text-gray-600">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 transition-colors duration-200 dark:text-gray-600 light:text-gray-400" />
              <p className="text-lg">开始与 {selectedRole.name} 对话吧</p>
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
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 dark:bg-gray-700 light:bg-gray-200">
                  {selectedRole.avatar_url ? (
                    <img
                      src={selectedRole.avatar_url}
                      alt={selectedRole.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium transition-colors duration-200 dark:text-gray-300 light:text-gray-600">
                      {selectedRole.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="message-bubble-ai">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="text-sm transition-colors duration-200 dark:text-gray-300 light:text-gray-700">AI 正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 错误状态 */}
            {error && (
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="message-bubble-ai bg-red-900 border border-red-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-300">{error}</p>
                    <button
                      onClick={onRetry}
                      className="ml-2 text-red-400 hover:text-red-300"
                      title="重试"
                    >
                      <AlertCircle className="w-4 h-4" />
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
        // disabled={!!error}
        disabled={false}
        placeholder={`输入消息...`}
      />
    </div>
  );
};

export default TextChatInterface;
