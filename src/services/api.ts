import axios from 'axios';
import type { Role, ChatResponse, HistoryResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时，因为语音处理可能需要较长时间
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`API请求: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`API响应: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API响应错误:', error);
    if (error.response) {
      // 服务器返回错误状态码
      const message = error.response.data?.message || `请求失败 (${error.response.status})`;
      throw new Error(message);
    } else if (error.request) {
      // 网络错误
      throw new Error('网络连接失败，请检查网络设置');
    } else {
      // 其他错误
      throw new Error(error.message || '未知错误');
    }
  }
);

// 获取角色列表
export const fetchRoles = async (): Promise<Role[]> => {
  try {
    const response = await api.get<Role[]>('/api/v1/roles');
    return response.data;
  } catch (error) {
    console.error('获取角色列表失败:', error);
    throw error;
  }
};

// 获取角色详情
export const fetchRoleDetail = async (roleId: string): Promise<Role> => {
  try {
    const response = await api.get<Role>(`/api/v1/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error('获取角色详情失败:', error);
    throw error;
  }
};

// 发起语音通话 (WebSocket)
export const createVoiceCallConnection = (roleId: string): WebSocket => {
  const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/voice-call/${roleId}`;
  return new WebSocket(wsUrl);
};

// 发起语音对话 (已弃用，保留用于兼容性)
export const sendAudioMessage = async (
  roleId: string,
  audioFile: File,
  sessionId?: string
): Promise<ChatResponse> => {
  try {
    const formData = new FormData();
    formData.append('role_id', roleId);
    formData.append('audio_file', audioFile);
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    const response = await api.post<ChatResponse>('/api/v1/chat/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('发送语音消息失败:', error);
    throw error;
  }
};

// 获取对话历史
export const fetchChatHistory = async (roleId: string): Promise<import('../types').ChatMessage[]> => {
  try {
    const response = await api.get<HistoryResponse>(`/api/v1/history/${roleId}`);
    return response.data.messages;
  } catch (error) {
    console.error('获取对话历史失败:', error);
    throw error;
  }
};

export default api;
