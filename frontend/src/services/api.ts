import axios from 'axios';
import type { Role, ChatResponse, HistoryResponse, LoginResponse, RegisterResponse, UploadTokenResponse, QiniuUploadResponse, VoiceChatRequest, VoiceChatResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 30秒超时，因为语音处理可能需要较长时间
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
    console.log(`API响应: ${response.status} ${response.config.url} `);
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

// 获取上传凭证
export const getUploadToken = async (): Promise<UploadTokenResponse> => {
  try {
    const response = await api.get<UploadTokenResponse>('/api/v1/upload/token');
    return response.data;
  } catch (error) {
    console.error('获取上传凭证失败:', error);
    throw error;
  }
};

// 将音频Blob转换为WAV格式
const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const arrayBuffer = this.result as ArrayBuffer;
      
      // 创建AudioContext来解码音频
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      audioContext.decodeAudioData(arrayBuffer)
        .then(audioBuffer => {
          // 将AudioBuffer转换为WAV格式
          const wavBlob = audioBufferToWav(audioBuffer);
          resolve(wavBlob);
        })
        .catch(error => {
          console.error('音频解码失败:', error);
          // 如果转换失败，返回原始blob
          resolve(audioBlob);
        });
    };
    
    fileReader.onerror = () => {
      reject(new Error('读取音频文件失败'));
    };
    
    fileReader.readAsArrayBuffer(audioBlob);
  });
};

// AudioBuffer转WAV格式的辅助函数
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  
  // 计算WAV文件大小
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV文件头
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  // RIFF标识符
  writeString(0, 'RIFF');
  // 文件长度
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  // WAVE标识符
  writeString(8, 'WAVE');
  // fmt子块
  writeString(12, 'fmt ');
  // fmt子块大小
  view.setUint32(16, 16, true);
  // 音频格式(PCM)
  view.setUint16(20, 1, true);
  // 声道数
  view.setUint16(22, numberOfChannels, true);
  // 采样率
  view.setUint32(24, sampleRate, true);
  // 字节率
  view.setUint32(28, sampleRate * numberOfChannels * bitsPerSample / 8, true);
  // 块对齐
  view.setUint16(32, numberOfChannels * bitsPerSample / 8, true);
  // 位深度
  view.setUint16(34, bitsPerSample, true);
  // data子块
  writeString(36, 'data');
  // data子块大小
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // 写入音频数据
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

// 简化版本：直接将webm转换为wav文件名的文件
const convertBlobToWavFile = async (audioBlob: Blob, originalName: string = 'recording'): Promise<File> => {
  try {
    // 尝试转换为WAV格式
    const wavBlob = await convertToWav(audioBlob);
    const fileName = originalName.replace(/\.[^/.]+$/, '') + '.wav';
    return new File([wavBlob], fileName, { type: 'audio/wav' });
  } catch (error) {
    console.error('转换为WAV失败，使用原始格式:', error);
    // 如果转换失败，至少改变文件扩展名和类型
    const fileName = originalName.replace(/\.[^/.]+$/, '') + '.wav';
    return new File([audioBlob], fileName, { type: 'audio/wav' });
  }
};

// 上传文件到七牛云
export const uploadToQiniu = async (
  file: File, 
  uploadToken: string, 
  upHost: string,
  convertToWavFormat: boolean = true
): Promise<QiniuUploadResponse> => {
  try {
    // 验证文件
    if (!file || file.size === 0) {
      throw new Error('文件为空或无效');
    }
    
    console.log('准备上传文件:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString()
    });
    
    let fileToUpload = file;
    
    // 如果需要转换为WAV格式且不是WAV文件
    if (convertToWavFormat && !file.type.includes('wav')) {
      console.log('正在转换音频格式为WAV...');
      try {
        fileToUpload = await convertBlobToWavFile(file, file.name);
        console.log('转换后的文件:', {
          name: fileToUpload.name,
          size: fileToUpload.size,
          type: fileToUpload.type
        });
      } catch (error) {
        console.warn('WAV转换失败，使用原始文件:', error);
        fileToUpload = file;
      }
    }
    
    const formData = new FormData();
    
    // 根据七牛云文档，必须的字段
    formData.append('token', uploadToken);
    formData.append('file', fileToUpload, fileToUpload.name || 'audio_file.wav');
    
    // 可选字段：生成一个唯一的key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileToUpload.name ? fileToUpload.name.split('.').pop() : 'wav';
    const key = `voice/${timestamp}_${randomStr}.${fileExtension}`;
    formData.append('key', key);
    
    // 正确的调试 FormData 方式
    console.log('上传参数:', {
      upHost,
      key,
      originalFileSize: file.size,
      uploadFileSize: fileToUpload.size,
      tokenLength: uploadToken.length
    });
    
    console.log('FormData 内容:');
    for (let [fieldName, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(fieldName, {
          name: value.name,
          size: value.size,
          type: value.type
        });
      } else {
        console.log(fieldName, value);
      }
    }
    
    // 发送请求到七牛云上传域名
    // 不要手动设置 Content-Type，让浏览器自动设置 boundary
    console.log('开始上传到七牛云...');
    const response = await axios.post(upHost, formData, {
      timeout: 60000, // 上传文件可能需要更长时间
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`上传进度: ${percentCompleted}%`);
        }
      }
    });
    
    console.log('上传文件到七牛云返回:', response.data);
    
    // 验证返回数据
    if (!response.data.key || !response.data.hash) {
      throw new Error('七牛云返回数据格式异常');
    }
    
    return response.data;
  } catch (error) {
    console.error('文件上传到七牛云失败:', error);
    if (axios.isAxiosError(error)) {
      console.error('响应数据:', error.response?.data);
      console.error('响应状态:', error.response?.status);
    }
    throw error;
  }
};

// 语音聊天接口
export const voiceChat = async (request: VoiceChatRequest): Promise<VoiceChatResponse> => {
  try {
    const response = await api.post<VoiceChatResponse>('/api/v1/voice/chat', request);
    return response.data;
  } catch (error) {
    console.error('语音聊天失败:', error);
    throw error;
  }
};

// 完整的语音处理流程
export const processVoiceMessage = async (
  audioFile: File,
  characterId: number,
  voiceId: string = 'qiniu_zh_female_tmjxxy'
): Promise<VoiceChatResponse> => {
  try {
    console.log('开始语音消息处理流程...');
    
    // 1. 获取上传凭证
    console.log('获取上传凭证...');
    const tokenInfo = await getUploadToken();
    console.log('上传凭证获取成功:', tokenInfo);
    
    // 2. 上传文件到七牛云（转换为WAV格式）
    console.log('上传文件到七牛云...');
    const uploadResult = await uploadToQiniu(audioFile, tokenInfo.upload_token, 'https://up-z0.qiniup.com', true);
    console.log('文件上传成功:', uploadResult);
    
    // 3. 构建文件URL
    const audioUrl = `http://${tokenInfo.bucket_domain}/${uploadResult.key}`;
    console.log('音频文件URL:', audioUrl);
    
    // 4. 由于转换为WAV格式，固定使用wav格式
    const audioFormat = 'wav';
    
    // 5. 调用语音聊天接口
    console.log('调用语音聊天接口...', {
      character_id: characterId,
      audio_url: audioUrl,
      audio_format: audioFormat,
      voice_id: voiceId
    });
    
    const chatResult = await voiceChat({
      character_id: characterId,
      audio_url: audioUrl,
      audio_format: audioFormat,
      voice_id: voiceId
    });
    
    console.log('语音聊天处理成功:', {
      transcribed_text: chatResult.transcribed_text,
      ai_text_response: chatResult.ai_text_response,
      audio_base64_length: chatResult.audio_base64?.length || 0
    });
    
    return chatResult;
  } catch (error) {
    console.error('语音消息处理失败:', error);
    throw error;
  }
};

export default api;
