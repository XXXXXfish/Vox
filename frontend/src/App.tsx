import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import RoleSelector from './components/RoleSelector';
import TextChatInterface from './components/TextChatInterface';
import LoadingSpinner from './components/LoadingSpinner';
import ThemeToggle from './components/ThemeToggle';
import { useRoles } from './hooks/useRoles';
import { useTextChat } from './hooks/useTextChat';
import type { Role } from './types';

const App: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { roles, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles();
  const { 
    messages, 
    isLoading: textChatLoading, 
    error: textChatError, 
    sendTextMessage, 
    loadHistory, 
    clearError: clearTextChatError,
    clearMessages 
  } = useTextChat();

  // 过滤角色
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 处理角色选择
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    // 加载该角色的聊天历史
    if (role) {
      loadHistory(role.ID);
    }
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
      <div className="flex h-screen">
        {/* 左侧边栏 */}
        <div className="w-80 sidebar flex flex-col">
          {/* 头部 */}
          <div className="p-6 border-b transition-colors duration-200 dark:border-gray-700 light:border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold transition-colors duration-200 dark:text-white light:text-gray-900 mb-2">Vox AI</h1>
                <p className="text-sm transition-colors duration-200 dark:text-gray-400 light:text-gray-600">与AI角色畅聊</p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* 搜索框 */}
          <div className="p-4 border-b transition-colors duration-200 dark:border-gray-700 light:border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 dark:text-gray-400 light:text-gray-500" />
              <input
                type="text"
                placeholder="搜索AI角色..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-10 pr-4 py-2"
              />
            </div>
          </div>

          {/* 角色列表 */}
          <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
            {rolesLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : rolesError ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">{rolesError}</p>
                <button onClick={handleRetry} className="btn-secondary">
                  重新加载
                </button>
              </div>
            ) : (
              <RoleSelector
                roles={filteredRoles}
                selectedRole={selectedRole}
                onRoleSelect={handleRoleSelect}
                loading={false}
              />
            )}
          </div>

          {/* 创建新角色 */}
          <div className="p-4 border-t transition-colors duration-200 dark:border-gray-700 light:border-gray-200">
            <h3 className="text-sm font-medium mb-3 transition-colors duration-200 dark:text-gray-400 light:text-gray-600">创建新角色</h3>
            <button className="flex items-center gap-2 transition-colors duration-200 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900">
              <Plus className="w-4 h-4" />
              <span className="text-sm">添加自定义角色</span>
            </button>
          </div>
        </div>

        {/* 右侧聊天区域 */}
        <div className="flex-1 chat-area">
          <TextChatInterface
            messages={messages}
            selectedRole={selectedRole}
            isLoading={textChatLoading}
            error={textChatError}
            onSendMessage={handleTextMessageSend}
            onClearMessages={clearMessages}
            onRetry={handleTextChatRetry}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
