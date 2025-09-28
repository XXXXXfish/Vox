import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Smile, Paperclip, Mic, Square } from 'lucide-react';
// 移除不再使用的导入
// import { sendTranscribeMessage } from '../services/api';
import { MessageOutlined } from '@ant-design/icons';
import type { Role } from '../types';

interface TextChatInputProps {
  onSendMessage: (message: string) => void;
  onAIResponse?: (message: string) => void; // 处理AI回复的回调
  onVoiceMessage?: (userMessage: string, aiMessage: string) => void; // 新增：处理语音消息的回调
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  selectedRole?: Role | null;
}

const TextChatInput: React.FC<TextChatInputProps> = ({
  onSendMessage,
  onAIResponse,
  onVoiceMessage,
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
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // 监听角色切换，停止当前播放的音频
  useEffect(() => {
    return () => {
      // 组件卸载或角色切换时停止音频播放
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    };
  }, [selectedRole]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 停止录音
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      // 停止音频播放
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

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
      // 尝试不同的音频格式，找到浏览器支持的
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // 使用默认格式
          }
        }
      }
      
      console.log('使用录音格式:', mimeType);
      
      mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('录音数据片段:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        console.log('录音停止，数据片段数量:', audioChunksRef.current.length);
        const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('总录音数据大小:', totalSize, 'bytes');
        
        if (audioChunksRef.current.length === 0 || totalSize === 0) {
          alert('录音数据为空，请重新录制');
          return;
        }
        
        // 使用录音时的mime类型创建Blob
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mimeType || 'audio/webm' 
        });
        
        console.log('创建的音频Blob:', {
          size: audioBlob.size,
          type: audioBlob.type
        });
        
        await handleVoiceMessage(audioBlob);
        
        // 清理资源
        stream.getTracks().forEach(track => track.stop());
      };
      
      // 每1秒收集一次数据，确保能获取到音频数据
      mediaRecorderRef.current.start(1000);
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
      
      // 检查录音数据
      console.log('录音 Blob 信息:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      if (audioBlob.size === 0) {
        throw new Error('录音数据为空，请重新录制');
      }
      
      // 将 Blob 转换为 File，确保有正确的文件名和类型
      const timestamp = Date.now();
      const fileName = `voice_message_${timestamp}.webm`;
      const audioFile = new File([audioBlob], fileName, {
        type: audioBlob.type || 'audio/webm'
      });
      
      console.log('转换后的 File 信息:', {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type
      });
      
      // // 可选：保存到本地（用于调试）
      // if (window.confirm('是否要先下载录音文件到本地？')) {
      //   const url = URL.createObjectURL(audioBlob);
      //   const a = document.createElement('a');
      //   a.href = url;
      //   a.download = fileName;
      //   document.body.appendChild(a);
      //   a.click();
      //   document.body.removeChild(a);
      //   URL.revokeObjectURL(url);
      // }
      
      // 使用新的语音处理流程
      const { processVoiceMessage } = await import('../services/api');
      const response = await processVoiceMessage(
        audioFile, 
        parseInt(selectedRole.ID), 
        'qiniu_zh_female_tmjxxy'
      );
      
      console.log('语音处理响应:', {
        transcribed_text: response.transcribed_text,
        ai_text_response: response.ai_text_response,
        audio_base64_length: response.audio_base64?.length || 0
      });
      
      // 处理返回的数据
      console.log('用户说:', response.transcribed_text);
      console.log('AI回复:', response.ai_text_response);
      
      // 使用语音消息回调处理用户消息和AI回复
      if (onVoiceMessage && response.transcribed_text && response.ai_text_response) {
        // 一次性处理用户语音消息和AI回复
        onVoiceMessage(response.transcribed_text, response.ai_text_response);
      } else {
        // 兼容旧的处理方式
        if (response.transcribed_text) {
          onSendMessage(`🎤 ${response.transcribed_text}`);
        }
        
        if (response.ai_text_response && onAIResponse) {
          onAIResponse(response.ai_text_response);
        }
      }
      
      // 处理返回的Base64音频数据并播放
      if (response.audio_base64) {
        try {
          // 停止之前播放的音频
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
          }
          
          // 将Base64数据转换为音频URL
          const audioData = `data:audio/mp3;base64,${response.audio_base64}`;
          const audio = new Audio(audioData);
          
          // 保存当前音频引用
          currentAudioRef.current = audio;
          
          // 播放AI回复的语音
          await audio.play();
          console.log('AI语音回复播放成功');
          
          // 播放完成后的处理
          audio.addEventListener('ended', () => {
            console.log('音频播放完成');
            // 清除当前音频引用
            if (currentAudioRef.current === audio) {
              currentAudioRef.current = null;
            }
          });
          
          // 播放错误处理
          audio.addEventListener('error', () => {
            console.error('音频播放出错');
            // 清除当前音频引用
            if (currentAudioRef.current === audio) {
              currentAudioRef.current = null;
            }
          });
          
        } catch (playError) {
          console.error('音频播放失败:', playError);
          const errorMessage = playError instanceof Error ? playError.message : '未知错误';
          alert('AI回复音频播放失败: ' + errorMessage);
          // 清除当前音频引用
          currentAudioRef.current = null;
        }
      } else {
        console.warn('没有收到音频数据');
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
