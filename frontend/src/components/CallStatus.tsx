import React from 'react';
import { Phone, PhoneOff, Loader2, Wifi, WifiOff } from 'lucide-react';
import { CallState } from '../hooks/useVoiceCall';
import type { Role } from '../types';

interface CallStatusProps {
  callState: CallState;
  selectedRole: Role | null;
  isConnected: boolean;
  callDuration?: number;
}

const CallStatus: React.FC<CallStatusProps> = ({
  callState,
  selectedRole,
  isConnected,
  callDuration = 0
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (callState) {
      case 'connecting':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'connected':
        return <Phone className="w-4 h-4 text-green-600" />;
      case 'disconnected':
        return <PhoneOff className="w-4 h-4 text-gray-600" />;
      case 'error':
        return <PhoneOff className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
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
        return '准备就绪';
    }
  };

  const getStatusColor = () => {
    switch (callState) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'disconnected':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (callState === 'idle') {
    return null;
  }

  return (
    <div className={`
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50
      px-4 py-2 rounded-full border backdrop-blur-sm
      ${getStatusColor()}
      flex items-center gap-2 shadow-lg
    `}>
      {getStatusIcon()}
      <span className="font-medium text-sm">{getStatusText()}</span>
      
      {selectedRole && (
        <>
          <span className="text-xs opacity-75">•</span>
          <span className="text-xs opacity-75">{selectedRole.name}</span>
        </>
      )}
      
      {callState === 'connected' && callDuration > 0 && (
        <>
          <span className="text-xs opacity-75">•</span>
          <span className="text-xs opacity-75">{formatDuration(callDuration)}</span>
        </>
      )}
      
      <div className="flex items-center gap-1 ml-2">
        {isConnected ? (
          <Wifi className="w-3 h-3 opacity-75" />
        ) : (
          <WifiOff className="w-3 h-3 opacity-75" />
        )}
      </div>
    </div>
  );
};

export default CallStatus;
