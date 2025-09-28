import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Smile, Paperclip, Mic, Square } from 'lucide-react';
import { sendTranscribeMessage } from '../services/api';
import { MessageOutlined } from '@ant-design/icons';
import type { Role } from '../types';

interface TextChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  selectedRole?: Role | null;
}

const TextChatInput: React.FC<TextChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
  placeholder = "输入消息...",
  selectedRole
}) => {
  const [message, setMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // 切换输入模式
  const toggleInputMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (isRecording) {
      stopRecording();
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        } 
      });
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleVoiceMessage(audioBlob);
        
        // 清理资源
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('无法启动录音:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 处理语音文件发送
  const handleVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedRole) {
      alert('请先选择一个角色');
      return;
    }

    try {
      setIsSendingVoice(true);
      
      // 将 Blob 转换为 File
      const audioFile = new File([audioBlob], 'voice_message.webm', {
        type: 'audio/webm'
      });
      
      // 调用 transcribe API，直接发送语音文件
      const response = await sendTranscribeMessage(selectedRole.ID.toString(), audioFile);
      
      // 处理后端响应（可能包含AI的回复）
      if (response.ai_response_text) {
        // 如果后端直接返回AI回复，可以在这里处理
        console.log('AI回复:', response.ai_response_text);
      }
      
    } catch (error) {
      console.error('语音消息发送失败:', error);
      alert('语音消息发送失败，请重试');
    } finally {
      setIsSendingVoice(false);
    }
  };

  // 处理语音按钮点击
  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="p-4 border-t transition-colors duration-200 dark:border-gray-700 light:border-gray-200 dark:bg-gray-800 light:bg-white backdrop-blur-sm">
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
          {isVoiceMode ? (
            <div className="flex items-center justify-center h-12 px-4 rounded-lg border-2 border-dashed transition-colors duration-200 dark:border-gray-600 light:border-gray-300 dark:bg-gray-700 light:bg-gray-50">
              {isRecording ? (
                <div className="flex items-center gap-3 text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">正在录音...</span>
                </div>
              ) : isSendingVoice ? (
                <div className="flex items-center gap-3 transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">正在发送...</span>
                </div>
              ) : (
                <span className="text-sm transition-colors duration-200 dark:text-gray-400 light:text-gray-600">点击麦克风开始录音</span>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="input w-full px-4 py-3 pr-12 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              rows={1}
              style={{ 
                minHeight: '48px', 
                maxHeight: '120px'
              }}
            />
          )}
        </div>

        {/* 右侧按钮 */}
        <div className="flex gap-2">
          {isLoading || isSendingVoice ? (
            <div className="p-3">
              <Loader2 className="w-5 h-5 animate-spin transition-colors duration-200 dark:text-gray-400 light:text-gray-600" />
            </div>
          ) : (
            <>
              {!isVoiceMode && (
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading || disabled}
                  className="p-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              )}
              
              {/* 语音模式切换按钮 */}
              <button
                type="button"
                onClick={toggleInputMode}
                className={`p-3 rounded-lg transition-colors ' bg-purple-600 hover:bg-purple-700' }`}
                disabled={disabled || isLoading || isSendingVoice}
                title={isVoiceMode ? '切换到文字输入' : '切换到语音输入'}
              >
                {isVoiceMode ? <MessageOutlined /> : <Mic />}
              </button>
              
              {/* 录音按钮（仅在语音模式下显示） */}
              {isVoiceMode && (
                <button
                  type="button"
                  onClick={handleVoiceButtonClick}
                  className={`p-3 rounded-lg transition-colors ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                  disabled={disabled || isSendingVoice}
                  title={isRecording ? '停止录音' : '开始录音'}
                >
                  {isRecording ? (
                    <Square className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default TextChatInput;
