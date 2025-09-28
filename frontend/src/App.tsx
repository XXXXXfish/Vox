import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, LogOut, User } from 'lucide-react';
import { Layout } from 'antd';
import ErrorBoundary from './components/ErrorBoundary';
import RoleSelector from './components/RoleSelector';
import TextChatInterface from './components/TextChatInterface';
import LoadingSpinner from './components/LoadingSpinner';
import ThemeToggle from './components/ThemeToggle';
import AuthPage from './components/AuthPage';
import { ConversationProvider } from './contexts/ConversationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useRoles } from './hooks/useRoles';
import { useTextChat } from './hooks/useTextChat';
import { useTheme } from './contexts/ThemeContext';
import type { Role } from './types';

const { Sider, Content } = Layout;

const AppContent: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(320); // 默认宽度
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { roles, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles();
  const { 
    messages, 
    isLoading: textChatLoading, 
    error: textChatError, 
    sendTextMessage, 
    loadConversation, 
    clearError: clearTextChatError,
    clearMessages 
  } = useTextChat();
  console.log('roles->>>>', roles);
  // 过滤角色
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 处理角色选择
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    // 加载该角色的对话记录
    if (role) {
      loadConversation(role.ID);
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

  // 处理清空消息
  const handleClearMessages = () => {
    if (selectedRole) {
      clearMessages(selectedRole.ID);
    }
  };

  // 处理错误重试
  const handleRetry = () => {
    if (rolesError) {
      refetchRoles();
    }
  };

  // 处理拖动开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // 处理拖动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    const minWidth = 250; // 最小宽度
    const maxWidth = 600; // 最大宽度
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  // 处理拖动结束
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // 监听全局鼠标事件
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <ErrorBoundary>
      <Layout className="h-screen">
        {/* 左侧边栏 */}
        <Sider
          width={sidebarWidth}
          style={{
            minWidth: sidebarWidth,
            maxWidth: sidebarWidth,
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            position: 'relative',
          }}
          className="sidebar"
        >
          <div 
            ref={sidebarRef}
            className="flex flex-col h-full"
            style={{ 
              width: sidebarWidth,
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
            }}
          >
            {/* 头部 */}
            <div className="p-6 border-b transition-colors duration-200 dark:border-gray-700 light:border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold transition-colors duration-200 dark:text-white light:text-gray-900 mb-2">Vox AI</h1>
                  <p className="text-sm transition-colors duration-200 dark:text-gray-400 light:text-gray-600">与AI角色畅聊</p>
                </div>
                <ThemeToggle />
              </div>
              
              {/* 用户信息 */}
              {user && (
                <div className="flex items-center justify-between pt-4 border-t transition-colors duration-200 dark:border-gray-700 light:border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 dark:bg-purple-600 light:bg-purple-100">
                      <User className="w-4 h-4 transition-colors duration-200 dark:text-white light:text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium transition-colors duration-200 dark:text-white light:text-gray-900">
                        {user.username}
                      </p>
                      <p className="text-xs transition-colors duration-200 dark:text-gray-400 light:text-gray-500">
                        在线
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg transition-colors duration-200 dark:text-gray-400 light:text-gray-500 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-gray-700 light:hover:bg-gray-100"
                    title="退出登录"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
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

          {/* 拖动手柄 */}
          <div
            className={`resize-handle ${isResizing ? 'resizing' : ''}`}
            onMouseDown={handleMouseDown}
            title="拖动调整侧边栏宽度"
          />
        </Sider>

        {/* 右侧聊天区域 */}
        <Content 
          className="chat-area flex-1 overflow-hidden"
          style={{
            backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb'
          }}
        >
          <TextChatInterface
            messages={messages}
            selectedRole={selectedRole}
            isLoading={textChatLoading}
            error={textChatError}
            onSendMessage={handleTextMessageSend}
            onClearMessages={handleClearMessages}
            onRetry={handleTextChatRetry}
          />
        </Content>
      </Layout>
    </ErrorBoundary>
  );
};

// 认证包装器组件
const AppWithAuth: React.FC = () => {
  const { user } = useAuth();

  // 如果用户未登录，显示认证页面
  if (!user) {
    return <AuthPage />;
  }

  // 如果用户已登录，显示主应用
  return (
    <ConversationProvider>
      <AppContent />
    </ConversationProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
};

export default App;
