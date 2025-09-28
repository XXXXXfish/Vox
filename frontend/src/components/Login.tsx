import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return;
    }
    
    try {
      await login(username, password);
    } catch (error) {
      // 错误已经在AuthContext中处理
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 transition-colors duration-200 dark:text-white light:text-gray-900">
            欢迎回来
          </h2>
          <p className="transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
            登录到您的账户
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg transition-colors duration-200 dark:bg-red-900/20 light:bg-red-50 dark:border-red-800 light:border-red-200 border">
            <p className="text-sm transition-colors duration-200 dark:text-red-400 light:text-red-600">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2 transition-colors duration-200 dark:text-gray-300 light:text-gray-700">
              用户名
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 transition-colors duration-200 dark:text-gray-400 light:text-gray-400" />
              </div>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input pl-10"
                placeholder="请输入用户名"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 transition-colors duration-200 dark:text-gray-300 light:text-gray-700">
              密码
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 transition-colors duration-200 dark:text-gray-400 light:text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10 pr-10"
                placeholder="请输入密码"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 transition-colors duration-200 dark:text-gray-400 light:text-gray-400 hover:dark:text-gray-300 hover:light:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 transition-colors duration-200 dark:text-gray-400 light:text-gray-400 hover:dark:text-gray-300 hover:light:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            className="btn-primary w-full"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
            还没有账户？{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-medium text-purple-600 hover:text-purple-500 transition-colors duration-200"
              disabled={isLoading}
            >
              立即注册
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;