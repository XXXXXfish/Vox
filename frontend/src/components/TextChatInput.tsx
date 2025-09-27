import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Smile, Paperclip, Mic } from 'lucide-react';

interface TextChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const TextChatInput: React.FC<TextChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
  placeholder = "输入消息..."
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 border-t transition-colors duration-200 dark:border-gray-700 light:border-gray-200 dark:bg-gray-800 light:bg-white">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* 左侧按钮 */}
        <div className="flex gap-2">
          <button
            type="button"
            className="p-2 transition-colors duration-200 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-gray-700 light:hover:bg-gray-100 rounded-lg"
            disabled={disabled || isLoading}
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 transition-colors duration-200 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-gray-700 light:hover:bg-gray-100 rounded-lg"
            disabled={disabled || isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        {/* 输入框 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="chat-input w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg resize-none text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-600 disabled:text-gray-500"
            rows={1}
            style={{ 
              minHeight: '48px', 
              maxHeight: '120px'
            }}
          />
        </div>

        {/* 右侧按钮 */}
        <div className="flex gap-2">
          {isLoading ? (
            <div className="p-3">
              <Loader2 className="w-5 h-5 animate-spin transition-colors duration-200 dark:text-gray-400 light:text-gray-600" />
            </div>
          ) : (
            <>
              <button
                type="submit"
                disabled={!message.trim() || isLoading || disabled}
                className="p-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
              <button
                type="button"
                className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                disabled={disabled || isLoading}
              >
                <Mic className="w-5 h-5 text-white" />
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default TextChatInput;
