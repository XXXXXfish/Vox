import React from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { useVoiceCall } from '../hooks/useVoiceCall';
import type { Role } from '../types';

interface VoiceCallInterfaceProps {
  selectedRole: Role | null;
  disabled?: boolean;
}

const VoiceCallInterface: React.FC<VoiceCallInterfaceProps> = ({
  selectedRole,
  disabled = false
}) => {
  const { 
    callState, 
    isMuted, 
    volume, 
    startCall, 
    endCall, 
    toggleMute, 
    setVolume, 
    error 
  } = useVoiceCall();

  const handleStartCall = async () => {
    if (!selectedRole) {
      alert('请先选择一个角色');
      return;
    }
    
    try {
      await startCall(selectedRole);
    } catch (err) {
      console.error('启动通话失败:', err);
    }
  };

  const handleEndCall = () => {
    endCall();
  };

  const getCallStateText = () => {
    switch (callState) {
      case 'connecting':
        return '正在连接...';
      case 'connected':
        return '通话中';
      case 'disconnected':
        return '通话已断开';
      case 'error':
        return '通话出错';
      default:
        return '准备通话';
    }
  };

  const getCallStateColor = () => {
    switch (callState) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      case 'disconnected':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const isCallActive = callState === 'connected' || callState === 'connecting';
  const canStartCall = callState === 'idle' && selectedRole && !disabled;

  return (
    <div className="card">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-4">语音通话</h3>
        
        {/* 通话状态 */}
        <div className="mb-6">
          <div className={`flex items-center justify-center gap-2 mb-2 ${getCallStateColor()}`}>
            {callState === 'connecting' && <Loader2 className="w-4 h-4 animate-spin" />}
            <span className="font-medium">{getCallStateText()}</span>
          </div>
          
          {selectedRole && (
            <p className="text-sm text-gray-600">
              与 <span className="font-medium">{selectedRole.name}</span> 通话
            </p>
          )}
        </div>

        {/* 主控制按钮 */}
        <div className="mb-6">
          {!isCallActive ? (
            <button
              onClick={handleStartCall}
              disabled={!canStartCall}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center
                transition-all duration-200 transform active:scale-95
                ${canStartCall
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <Phone className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-95"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* 通话控制按钮 */}
        {isCallActive && (
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* 静音按钮 */}
            <button
              onClick={toggleMute}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                transition-all duration-200
                ${isMuted 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }
              `}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* 音量控制 */}
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition-colors">
                <Volume2 className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {/* 使用提示 */}
        {!selectedRole && !error && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              请先选择一个角色，然后点击通话按钮开始语音通话
            </p>
          </div>
        )}

        {/* 通话质量指示器 */}
        {isCallActive && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span className="ml-2 text-xs text-gray-500">通话质量良好</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceCallInterface;
