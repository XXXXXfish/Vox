// 角色相关类型
export interface Role {
  ID: string;
  name: string;
  avatar_url: string;
  description: string;
  voice_id?: string; // 当前使用的音色ID
}

// 聊天消息类型
export interface ChatMessage {
  id: string;
  speaker?: 'user' | 'ai';
  text: string;
  audio_url?: string;
  timestamp?: number;
  session_id: string;
}

// API 响应类型
export interface RolesResponse {
  roles: Role[];
}

export interface ChatResponse {
  ai_response_text?: string;
  response?: string;
  ai_audio_url?: string;
  session_id: string;
}

export interface HistoryResponse {
  messages: ChatMessage[];
}

// 通话状态
export type CallState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

// 录音状态 (已弃用)
export type RecordingState = 'idle' | 'recording' | 'processing';

// 播放状态 (已弃用)
export type PlaybackState = 'idle' | 'playing' | 'paused';

// WebSocket 消息类型
export interface WebSocketMessage {
  type: 'audio' | 'text' | 'status' | 'error';
  data: any;
  timestamp: number;
}

// 用户认证类型
export interface User {
  id: number;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

// 上传凭证相关类型
export interface UploadTokenResponse {
  upload_token: string;
  up_host: string;
  bucket_domain: string;
}

// 七牛云上传响应类型
export interface QiniuUploadResponse {
  hash: string; // 目标资源的hash值，可用于 ETag 头部
  key: string;  // 目标资源的最终名字，可由七牛云存储自动命名
}

// 语音聊天相关类型
export interface VoiceChatRequest {
  character_id: number;
  audio_url: string;
  audio_format: string;
  voice_id: string;
}

export interface VoiceChatResponse {
  transcribed_text: string; // 转录的用户语音文本
  ai_text_response: string; // AI的文本回复
  audio_base64: string; // Base64 编码的音频数据
}

// 语音通话配置
export interface VoiceCallConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

// 音色相关类型
export interface Voice {
  voice_name: string;
  voice_type: string; // 音色ID
  url: string;
  category: string;
}

export interface UpdateVoiceRequest {
  voice_id: string;
}

export interface UpdateVoiceResponse {
  new_voice_id: string;
}

// 创建角色相关类型
export interface CreateCharacterRequest {
  name: string;
  system_prompt: string;
  description?: string;
}

export interface CreateCharacterResponse {
  message: string;
  character_id: number;
}
