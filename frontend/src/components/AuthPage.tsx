import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import ThemeToggle from './ThemeToggle';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-200 dark:bg-gray-900 light:bg-gray-50">
      {/* 主题切换按钮 */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      {/* 认证表单容器 */}
      <div className="w-full max-w-md">
        {/* 品牌标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold transition-colors duration-200 dark:text-white light:text-gray-900 mb-2">
            Vox
          </h1>
          <p className="text-lg transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
            AI 语音交互平台
          </p>
        </div>

        {/* 切换动画容器 */}
        <div className="relative">
          <div className={`transition-all duration-300 ease-in-out ${isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute inset-0 pointer-events-none'}`}>
            {isLogin && <Login onSwitchToRegister={switchToRegister} />}
          </div>
          
          <div className={`transition-all duration-300 ease-in-out ${!isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 absolute inset-0 pointer-events-none'}`}>
            {!isLogin && <Register onSwitchToLogin={switchToLogin} />}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-xs transition-colors duration-200 dark:text-gray-500 light:text-gray-400">
            By using Vox, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;