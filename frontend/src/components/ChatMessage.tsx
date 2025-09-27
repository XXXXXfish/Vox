import React from 'react';
import { User, Bot, Play, Pause, Volume2, Loader2 } from 'lucide-react';
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
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* 头像 */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isUser ? 'order-2' : 'order-1'
      }`}>
        {isUser ? (
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden">
            {roleAvatar ? (
              <img src={roleAvatar} alt="角色头像" className="w-full h-full object-cover" />
            ) : (
              <Bot className="w-5 h-5 text-gray-600 m-auto" />
            )}
          </div>
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex flex-col max-w-[70%] ${isUser ? 'order-1 items-end' : 'order-2 items-start'}`}>
        {/* 消息气泡 */}
        <div className={`
          rounded-2xl px-4 py-3 shadow-sm
          ${isUser 
            ? 'bg-primary-600 text-white rounded-br-md' 
            : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
          }
        `}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          
          {/* AI 音频播放按钮 */}
          {!isUser && message.audio_url && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleAudioPlay}
                disabled={isLoadingAudio}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isLoadingAudio ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span className="text-xs">
                  {isLoadingAudio ? '加载中...' : isPlaying ? '暂停' : '播放语音'}
                </span>
              </button>
              
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* 时间戳 */}
        <span className="text-xs text-gray-500 mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
