import axios from 'axios';
import type { Role, ChatResponse, HistoryResponse, LoginResponse, RegisterResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时，因为语音处理可能需要较长时间
});

// 请求拦截器
api.interceptors.request.use(
  (config: any) => {
    console.log(`API请求: ${config.method?.toUpperCase()} ${config.url}`);
    
    // 自动添加认证令牌（除了登录和注册接口）
    const token = localStorage.getItem('auth_token');
    if (token && !config.url?.includes('/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: any) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: any) => {
    console.log(`API响应: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: any) => {
    console.error('API响应错误:', error);
    if (error.response) {
      // 如果是401未认证错误，清除本地存储的认证信息
      if (error.response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        // 刷新页面回到登录状态
        window.location.reload();
      }
      
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
    const response = await api.get<Role[]>('/api/v1/characters');
    // const response = JSON.parse('{"data":[{"ID":1,"CreatedAt":"2025-09-27T15:50:11.640574+08:00","UpdatedAt":"2025-09-27T15:50:11.640574+08:00","DeletedAt":null,"name":"哈利·波特","description":"霍格沃茨魔法学校的学生，擅长黑魔法防御术。","system_prompt":"你是一个15岁的哈利·波特，住在霍格沃茨。你的语气充满好奇和正义感，对黑魔法和伏地魔充满警惕。你的回答中应包含魔法元素。"},{"ID":2,"CreatedAt":"2025-09-27T15:50:11.642941+08:00","UpdatedAt":"2025-09-27T15:50:11.642941+08:00","DeletedAt":null,"name":"苏格拉底","description":"古希腊哲学家，以提问的方式引导思考。","system_prompt":"你是一个古希腊哲学家苏格拉底，专注于通过不断提问（苏格拉底式提问）来引导用户进行自我反思和思考。你的回答应该简短且富有哲理。"}],"page":1,"pageSize":10,"total":2}')
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

// 发送文字消息
export const sendTextMessage = async (
  characterId: string,
  newMessage: string
): Promise<ChatResponse> => {
  try {
    const response = await api.post<ChatResponse>('/api/v1/chat', {
      character_id: characterId,
      new_message: newMessage
    });
    console.log('sendTextMessage response.data--->', response.data);
    return response.data;
  } catch (error) {
    console.error('发送文字消息失败:', error);
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

// 语音转文字接口
export const sendTranscribeMessage = async (
  roleId: string,
  audioFile: File,
  sessionId?: string
): Promise<ChatResponse & { transcribed_text?: string }> => {
  try {
    const formData = new FormData();
    formData.append('role_id', roleId);
    formData.append('audio_file', audioFile);
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    const response = await api.post<ChatResponse & { transcribed_text?: string }>('/api/v1/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('语音转写失败:', error);
    throw error;
  }
};

// 用户登录
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password
    });
    return response.data;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

// 用户注册
export const register = async (username: string, password: string): Promise<RegisterResponse> => {
  try {
    const response = await api.post<RegisterResponse>('/auth/register', {
      username,
      password
    });
    return response.data;
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
};

export default api;
