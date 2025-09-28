import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { register, isLoading, error } = useAuth();

  const validateForm = () => {
    if (!username.trim()) {
      setValidationError('请输入用户名');
      return false;
    }
    if (username.length < 3) {
      setValidationError('用户名至少需要3个字符');
      return false;
    }
    if (!password.trim()) {
      setValidationError('请输入密码');
      return false;
    }
    if (password.length < 6) {
      setValidationError('密码至少需要6个字符');
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError('两次输入的密码不一致');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await register(username, password);
    } catch (error) {
      // 错误已经在AuthContext中处理
    }
  };

  const displayError = validationError || error;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 transition-colors duration-200 dark:text-white light:text-gray-900">
            创建账户
          </h2>
          <p className="transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
            注册新账户开始使用
          </p>
        </div>

        {displayError && (
          <div className="mb-4 p-3 rounded-lg transition-colors duration-200 dark:bg-red-900/20 light:bg-red-50 dark:border-red-800 light:border-red-200 border">
            <p className="text-sm transition-colors duration-200 dark:text-red-400 light:text-red-600">
              {displayError}
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
                onChange={(e) => {
                  setUsername(e.target.value);
                  setValidationError(null);
                }}
                className="input pl-10"
                placeholder="请输入用户名（至少3个字符）"
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError(null);
                }}
                className="input pl-10 pr-10"
                placeholder="请输入密码（至少6个字符）"
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 transition-colors duration-200 dark:text-gray-300 light:text-gray-700">
              确认密码
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 transition-colors duration-200 dark:text-gray-400 light:text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setValidationError(null);
                }}
                className="input pl-10 pr-10"
                placeholder="请再次输入密码"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 transition-colors duration-200 dark:text-gray-400 light:text-gray-400 hover:dark:text-gray-300 hover:light:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 transition-colors duration-200 dark:text-gray-400 light:text-gray-400 hover:dark:text-gray-300 hover:light:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim() || !confirmPassword.trim()}
            className="btn-primary w-full"
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
            已有账户？{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-purple-600 hover:text-purple-500 transition-colors duration-200"
              disabled={isLoading}
            >
              立即登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;