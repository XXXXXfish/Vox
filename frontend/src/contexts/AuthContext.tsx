import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';
import type { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化时从localStorage读取token和用户信息
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiLogin(username, password);
      const newToken = response.token;
      
      // 这里暂时只保存用户名，实际应用中可能需要从token中解析用户信息
      const newUser: User = {
        id: 0, // 临时ID，实际应该从响应或token中获取
        username
      };
      
      setToken(newToken);
      setUser(newUser);
      
      // 保存到localStorage
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiRegister(username, password);
      
      // 注册成功后自动登录
      await login(username, password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};