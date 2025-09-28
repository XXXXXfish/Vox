import React from 'react';
import { User, Bot, Play, Pause, Loader2, Mic } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  roleAvatar?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, roleAvatar }) => {
  const { playbackState, play, pause } = useAudioPlayer();
  const [isLoadingAudio, setIsLoadingAudio] = React.useState(false);

  const isUser = message.speaker === 'user';
  const isPlaying = playbackState === 'playing';
  const hasAudio = message.audio_url && message.audio_url.length > 0;

  const handleAudioPlay = async () => {
    if (!message.audio_url) return;
    
    try {
      setIsLoadingAudio(true);
      if (isPlaying) {
        pause();
      } else {
        await play(message.audio_url);
      }
    } catch (error) {
      console.error('音频播放失败:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* AI消息显示头像 */}
      {!isUser && (
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 dark:bg-gray-700 light:bg-gray-200">
          {roleAvatar ? (
            <img src={roleAvatar} alt="角色头像" className="w-full h-full object-cover rounded-full" />
          ) : (
            <Bot className="w-5 h-5 transition-colors duration-200 dark:text-gray-300 light:text-gray-600" />
          )}
        </div>
      )}

      {/* 消息内容 */}
      <div className={`flex flex-col max-w-xs ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 消息气泡 */}
        <div className={`${isUser ? 'message-bubble-user' : 'message-bubble-ai'}`}>
          {/* 文本消息 */}
          {message.text && message.text.trim() && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          )}
          
          {/* 语音消息显示 */}
          {hasAudio && (
            <div className="flex items-center gap-2 mt-2">
              <Mic className="w-4 h-4 transition-colors duration-200 dark:text-gray-400 light:text-gray-500" />
              <span className="text-xs transition-colors duration-200 dark:text-gray-400 light:text-gray-500">
                {isUser ? '语音消息 · 15秒' : '语音回复 · 12秒'}
              </span>
              {!isUser && (
                <button
                  onClick={handleAudioPlay}
                  disabled={isLoadingAudio}
                  className="ml-2 p-1 rounded transition-colors duration-200 dark:hover:bg-gray-600 light:hover:bg-gray-200"
                >
                  {isLoadingAudio ? (
                    <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                  ) : isPlaying ? (
                    <Pause className="w-3 h-3 text-purple-400" />
                  ) : (
                    <Play className="w-3 h-3 text-purple-400" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* 时间戳 - 只在有文本消息时显示 */}
        {message.text && message.text.trim() && (
          <span className="text-xs mt-1 px-1 transition-colors duration-200 dark:text-gray-500 light:text-gray-400">
            {formatTime(message.timestamp || Date.now())}
          </span>
        )}
      </div>

      {/* 用户消息显示头像 */}
      {isUser && (
        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
