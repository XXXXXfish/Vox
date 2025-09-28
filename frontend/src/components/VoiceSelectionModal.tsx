import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, X } from 'lucide-react';
import { fetchVoices, updateCharacterVoice } from '../services/api';
import type { Voice, Role } from '../types';

interface VoiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: Role;
  currentVoiceId?: string;
  onVoiceUpdated: (newVoiceId: string) => void;
}

const VoiceSelectionModal: React.FC<VoiceSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedRole,
  currentVoiceId,
  onVoiceUpdated
}) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(currentVoiceId || '');
  const [updating, setUpdating] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // 加载音色列表
  useEffect(() => {
    if (isOpen) {
      loadVoices();
    }
  }, [isOpen]);

  const loadVoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const voiceList = await fetchVoices();
      setVoices(voiceList);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载音色列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 播放音色示例
  const playVoiceSample = async (voice: Voice) => {
    try {
      // 停止当前播放的音频
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }

      if (playingVoice === voice.voice_type) {
        // 如果点击的是正在播放的音色，停止播放
        setPlayingVoice(null);
        setAudioRef(null);
        return;
      }

      // 播放新的音色示例
      const audio = new Audio(voice.url);
      setAudioRef(audio);
      setPlayingVoice(voice.voice_type);

      audio.addEventListener('ended', () => {
        setPlayingVoice(null);
        setAudioRef(null);
      });

      audio.addEventListener('error', () => {
        console.error('音频播放失败');
        setPlayingVoice(null);
        setAudioRef(null);
      });

      await audio.play();
    } catch (error) {
      console.error('播放音色示例失败:', error);
      setPlayingVoice(null);
      setAudioRef(null);
    }
  };

  // 更新角色音色
  const handleUpdateVoice = async () => {
    if (!selectedVoiceId || selectedVoiceId === currentVoiceId) {
      onClose();
      return;
    }

    try {
      setUpdating(true);
      const result = await updateCharacterVoice(selectedRole.ID, selectedVoiceId);
      console.log('音色更新成功:', result);
      onVoiceUpdated(result.new_voice_id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新音色失败');
    } finally {
      setUpdating(false);
    }
  };

  // 按类别分组音色
  const voicesByCategory = voices.reduce((acc, voice) => {
    if (!acc[voice.category]) {
      acc[voice.category] = [];
    }
    acc[voice.category].push(voice);
    return acc;
  }, {} as Record<string, Voice[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b transition-colors duration-200 dark:border-gray-700 light:border-gray-200">
          <div>
            <h2 className="text-xl font-bold transition-colors duration-200 dark:text-white light:text-gray-900">
              选择音色
            </h2>
            <p className="text-sm mt-1 transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
              为 "{selectedRole.name}" 选择新的音色
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors duration-200 dark:text-gray-400 light:text-gray-500 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-gray-700 light:hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={loadVoices} className="btn-secondary">
                重新加载
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(voicesByCategory).map(([category, categoryVoices]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3 transition-colors duration-200 dark:text-white light:text-gray-900">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {categoryVoices.map((voice) => (
                      <div
                        key={voice.voice_type}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedVoiceId === voice.voice_type
                            ? 'border-purple-500 dark:bg-purple-900/20 light:bg-purple-50'
                            : 'transition-colors duration-200 dark:border-gray-700 light:border-gray-200 dark:hover:border-gray-600 light:hover:border-gray-300 dark:hover:bg-gray-700 light:hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedVoiceId(voice.voice_type)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedVoiceId === voice.voice_type
                                ? 'border-purple-500 bg-purple-500'
                                : 'transition-colors duration-200 dark:border-gray-500 light:border-gray-300'
                            }`}>
                              {selectedVoiceId === voice.voice_type && (
                                <Check className="w-2 h-2 text-white m-0.5" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium transition-colors duration-200 dark:text-white light:text-gray-900">
                                {voice.voice_name}
                              </h4>
                              {/* <p className="text-sm transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
                                {voice.voice_type}
                              </p> */}
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoiceSample(voice);
                            }}
                            className="flex items-center gap-2 px-3 py-1 rounded-lg transition-colors duration-200 dark:text-gray-400 light:text-gray-600 dark:hover:text-white light:hover:text-gray-900 dark:hover:bg-gray-700 light:hover:bg-gray-100"
                            disabled={playingVoice === voice.voice_type}
                          >
                            {playingVoice === voice.voice_type ? (
                              <>
                                <Pause className="w-4 h-4" />
                                <span className="text-sm">停止</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                <span className="text-sm">试听</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t transition-colors duration-200 dark:border-gray-700 light:border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={updating}
          >
            取消
          </button>
          <button
            onClick={handleUpdateVoice}
            className="btn-primary"
            disabled={updating || !selectedVoiceId || selectedVoiceId === currentVoiceId}
          >
            {updating ? '更新中...' : '确定'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelectionModal;