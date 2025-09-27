import React, { useState, useEffect } from 'react';
import { Brain, RefreshCw, AlertCircle, MessageSquare, Mic } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import RoleSelector from './components/RoleSelector';
import VoiceCallInterface from './components/VoiceCallInterface';
import TextChatInterface from './components/TextChatInterface';
import CallStatus from './components/CallStatus';
import LoadingSpinner from './components/LoadingSpinner';
import { useRoles } from './hooks/useRoles';
import { useVoiceCall } from './hooks/useVoiceCall';
import { useTextChat } from './hooks/useTextChat';
import type { Role } from './types';

type ChatMode = 'voice' | 'text';

const App: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMode, setChatMode] = useState<ChatMode>('text');
  const { roles, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles();
  const { callState, endCall } = useVoiceCall();
  const { 
    messages, 
    isLoading: textChatLoading, 
    error: textChatError, 
    sendTextMessage, 
    loadHistory, 
    clearError: clearTextChatError,
    clearMessages 
  } = useTextChat();

  // 通话时长计时器
  useEffect(() => {
    let interval: number;
    
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [callState]);

  // 处理角色选择
  const handleRoleSelect = (role: Role) => {
    // 如果正在通话中，先结束通话
    if (callState === 'connected' || callState === 'connecting') {
      endCall();
    }
    setSelectedRole(role);
    // 加载该角色的聊天历史
    if (role) {
      loadHistory(role.ID);
    }
  };

  // 处理聊天模式切换
  const handleChatModeChange = (mode: ChatMode) => {
    // 如果正在语音通话中，先结束通话
    if (mode === 'text' && (callState === 'connected' || callState === 'connecting')) {
      endCall();
    }
    setChatMode(mode);
  };

  // 处理文字消息发送
  const handleTextMessageSend = (message: string) => {
    if (selectedRole) {
      sendTextMessage(message, selectedRole);
    }
  };

  // 处理文字聊天重试
  const handleTextChatRetry = () => {
    clearTextChatError();
  };

  // 处理错误重试
  const handleRetry = () => {
    if (rolesError) {
      refetchRoles();
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* 头部 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">AI 角色扮演聊天</h1>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 聊天模式切换 */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleChatModeChange('text')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      chatMode === 'text'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    文字对话
                  </button>
                  <button
                    onClick={() => handleChatModeChange('voice')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      chatMode === 'voice'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    语音通话
                  </button>
                </div>
                
                {rolesError && (
                  <button
                    onClick={handleRetry}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重试
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 通话状态栏 - 仅在语音模式下显示 */}
        {chatMode === 'voice' && (
          <CallStatus
            callState={callState}
            selectedRole={selectedRole}
            isConnected={callState === 'connected'}
            callDuration={callDuration}
          />
        )}

        {/* 主要内容 */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：角色选择 */}
            <div>
              {rolesError ? (
                <div className="card">
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
                    <p className="text-gray-600 mb-4">{rolesError}</p>
                    <button onClick={handleRetry} className="btn-primary">
                      重新加载
                    </button>
                  </div>
                </div>
              ) : (
                <RoleSelector
                  roles={roles}
                  selectedRole={selectedRole}
                  onRoleSelect={handleRoleSelect}
                  loading={rolesLoading}
                />
              )}
            </div>

            {/* 右侧：聊天界面 */}
            <div>
              {chatMode === 'text' ? (
                <TextChatInterface
                  messages={messages}
                  selectedRole={selectedRole}
                  isLoading={textChatLoading}
                  error={textChatError}
                  onSendMessage={handleTextMessageSend}
                  onClearMessages={clearMessages}
                  onRetry={handleTextChatRetry}
                />
              ) : (
                <VoiceCallInterface
                  selectedRole={selectedRole}
                  disabled={rolesLoading}
                />
              )}
            </div>
          </div>
        </main>

        {/* 全局加载状态 */}
        {rolesLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <LoadingSpinner size="lg" />
              <span className="text-lg">正在加载角色列表...</span>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
