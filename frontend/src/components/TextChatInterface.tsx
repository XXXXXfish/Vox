import React, { useEffect, useRef, useState } from 'react';
import { DeleteOutlined, PhoneOutlined } from '@ant-design/icons';
import { MessageSquare, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import TextChatInput from './TextChatInput';
import VoiceSelectionModal from './VoiceSelectionModal';
import type { ChatMessage as ChatMessageType, Role } from '../types';

interface TextChatInterfaceProps {
  messages: ChatMessageType[];
  selectedRole: Role | null;
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onAIResponse?: (message: string) => void; // 处理AI回复的回调
  onVoiceMessage?: (userMessage: string, aiMessage: string) => void; // 新增：处理语音消息的回调
  onClearMessages: () => void;
  onRetry: () => void;
}

const TextChatInterface: React.FC<TextChatInterfaceProps> = ({
  messages,
  selectedRole,
  isLoading,
  error,
  onSendMessage,
  onAIResponse,
  onVoiceMessage,
  onClearMessages,
  onRetry
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [currentVoiceId, setCurrentVoiceId] = useState<string>('');

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 初始化当前音色ID
  useEffect(() => {
    if (selectedRole?.voice_id) {
      setCurrentVoiceId(selectedRole.voice_id);
    }
  }, [selectedRole]);

  // 处理音色更新
  const handleVoiceUpdated = (newVoiceId: string) => {
    setCurrentVoiceId(newVoiceId);
    console.log(`角色 ${selectedRole?.name} 的音色已更新为: ${newVoiceId}`);
  };

  if (!selectedRole) {
    return (
      <div className="chat-area flex items-center justify-center">
        <div className="text-center transition-colors duration-200 dark:text-gray-300 light:text-gray-600">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 transition-colors duration-200 dark:text-gray-500 light:text-gray-400" />
          <p className="text-lg transition-colors duration-200 dark:text-gray-300 light:text-gray-700">请先选择一个角色开始对话</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b transition-colors duration-200 dark:border-gray-700 light:border-gray-200 dark:bg-gray-800 light:bg-white backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden transition-colors duration-200 dark:bg-gray-700 light:bg-gray-100 flex items-center justify-center">
            {selectedRole.avatar_url ? (
              <img
                src={selectedRole.avatar_url}
                alt={selectedRole.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium transition-colors duration-200 dark:text-gray-200 light:text-gray-600">
                {selectedRole.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-medium transition-colors duration-200 dark:text-gray-100 light:text-gray-900">{selectedRole.name}</h3>
            <p className="text-sm transition-colors duration-200 dark:text-gray-300 light:text-gray-600">
              {isLoading ? '正在输入...' : '在线'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 音色设置按钮 */}
          <button
            onClick={() => setShowVoiceModal(true)}
            className="p-2 transition-colors duration-200 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-gray-700 light:hover:bg-gray-100 rounded-md"
            title="设置音色"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          
          {messages && messages.length > 0 && (
            <button
              onClick={onClearMessages}
              className="p-2 transition-colors duration-200 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-gray-700 light:hover:bg-gray-100 rounded-md"
            >
              <DeleteOutlined style={{ fontSize: '18px' }} />
            </button>
          )}
          <button className="p-2 transition-colors duration-200 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-gray-700 light:hover:bg-gray-100 rounded-md">
            <PhoneOutlined style={{ fontSize: '18px' }} />
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {!messages || messages.length === 0 ? (
          <div className="h-full flex items-center justify-center transition-colors duration-200 dark:text-gray-300 light:text-gray-600">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 transition-colors duration-200 dark:text-gray-500 light:text-gray-400" />
              <p className="text-lg transition-colors duration-200 dark:text-gray-300 light:text-gray-700">开始与 {selectedRole.name} 对话吧</p>
            </div>
          </div>
        ) : (
          <>
            {messages && messages.map((message) => (
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
                    <span className="text-sm transition-colors duration-200 dark:text-white light:text-gray-900">AI 正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 错误状态 */}
            {error && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 dark:bg-red-900 light:bg-red-100">
                  <AlertCircle className="w-5 h-5 transition-colors duration-200 dark:text-red-400 light:text-red-600" />
                </div>
                <div className="rounded-2xl rounded-bl-md px-4 py-3 max-w-xs transition-colors duration-200 dark:bg-red-900 dark:border-red-700 light:bg-red-50 light:border-red-200 border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm transition-colors duration-200 dark:text-red-300 light:text-red-700">{error}</p>
                    <button
                      onClick={onRetry}
                      className="ml-2 transition-colors duration-200 dark:text-red-400 dark:hover:text-red-300 light:text-red-600 light:hover:text-red-500"
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
        onAIResponse={onAIResponse}
        onVoiceMessage={onVoiceMessage}
        isLoading={isLoading}
        // disabled={!!error}
        disabled={false}
        placeholder={`输入消息...`}
        selectedRole={selectedRole}
      />

      {/* 音色选择模态框 */}
      {selectedRole && (
        <VoiceSelectionModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          selectedRole={selectedRole}
          currentVoiceId={currentVoiceId}
          onVoiceUpdated={handleVoiceUpdated}
        />
      )}
    </div>
  );
};

export default TextChatInterface;
