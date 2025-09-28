// 角色相关类型
export interface Role {
  ID: string;
  name: string;
  avatar_url: string;
  description: string;
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

// 语音通话配置
export interface VoiceCallConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}
