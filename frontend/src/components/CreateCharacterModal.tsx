import React, { useState } from 'react';
import { X, Plus, User, FileText, MessageSquare } from 'lucide-react';
import { createCharacter } from '../services/api';
import type { CreateCharacterRequest } from '../types';

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: () => void; // 创建成功后的回调
}

const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({
  isOpen,
  onClose,
  onCharacterCreated
}) => {
  const [formData, setFormData] = useState<CreateCharacterRequest>({
    name: '',
    system_prompt: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreateCharacterRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null); // 清除错误信息
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.name.trim()) {
      setError('角色名称不能为空');
      return;
    }
    
    if (!formData.system_prompt.trim()) {
      setError('系统提示词不能为空');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await createCharacter({
        name: formData.name.trim(),
        system_prompt: formData.system_prompt.trim(),
        description: formData.description?.trim() || undefined
      });

      console.log('角色创建成功:', response);
      
      // 重置表单
      setFormData({
        name: '',
        system_prompt: '',
        description: ''
      });
      
      // 通知父组件刷新角色列表
      onCharacterCreated();
      
      // 关闭模态框
      onClose();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建角色失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // 重置表单
      setFormData({
        name: '',
        system_prompt: '',
        description: ''
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg transition-colors duration-200 dark:bg-purple-600 light:bg-purple-100">
              <Plus className="w-5 h-5 transition-colors duration-200 dark:text-white light:text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold transition-colors duration-200 dark:text-white light:text-gray-900">
                创建新角色
              </h2>
              <p className="text-sm transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
                定义你的AI角色特性和行为
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 rounded-lg transition-colors duration-200 dark:text-gray-400 light:text-gray-500 dark:hover:text-white light:hover:text-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 rounded-lg transition-colors duration-200 dark:bg-red-900/20 light:bg-red-50 dark:border-red-800 light:border-red-200 border">
            <p className="text-sm transition-colors duration-200 dark:text-red-400 light:text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 角色名称 */}
          <div>
            <label className="block text-sm font-medium mb-2 transition-colors duration-200 dark:text-gray-300 light:text-gray-700">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                角色名称 *
              </div>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="input"
              placeholder="例如：智能助手、哈利·波特、苏格拉底..."
              disabled={isLoading}
              maxLength={50}
            />
            <p className="text-xs mt-1 transition-colors duration-200 dark:text-gray-400 light:text-gray-500">
              角色的显示名称，用户将看到这个名字
            </p>
          </div>

          {/* 角色描述 */}
          <div>
            <label className="block text-sm font-medium mb-2 transition-colors duration-200 dark:text-gray-300 light:text-gray-700">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                角色描述
              </div>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="input"
              placeholder="例如：一个善于解答问题的智能助手..."
              disabled={isLoading}
              maxLength={200}
            />
            <p className="text-xs mt-1 transition-colors duration-200 dark:text-gray-400 light:text-gray-500">
              简短描述角色的特点（可选）
            </p>
          </div>

          {/* 系统提示词 */}
          <div>
            <label className="block text-sm font-medium mb-2 transition-colors duration-200 dark:text-gray-300 light:text-gray-700">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                系统提示词 *
              </div>
            </label>
            <textarea
              value={formData.system_prompt}
              onChange={(e) => handleInputChange('system_prompt', e.target.value)}
              className="input min-h-[120px] resize-y"
              placeholder="你是一个友善的AI助手，专注于帮助用户解决问题。你的回答应该准确、有用，并且保持礼貌的语调..."
              disabled={isLoading}
              maxLength={2000}
            />
            <p className="text-xs mt-1 transition-colors duration-200 dark:text-gray-400 light:text-gray-500">
              定义角色的性格、行为方式和回答风格。这将影响AI的所有回复。
            </p>
          </div>

          {/* 提示信息 */}
          <div className="p-4 rounded-lg transition-colors duration-200 dark:bg-blue-900/20 light:bg-blue-50 dark:border-blue-800 light:border-blue-200 border">
            <h4 className="text-sm font-medium mb-2 transition-colors duration-200 dark:text-blue-400 light:text-blue-600">
              💡 提示
            </h4>
            <ul className="text-xs space-y-1 transition-colors duration-200 dark:text-blue-300 light:text-blue-600">
              <li>• 系统提示词越详细，角色表现越精准</li>
              <li>• 可以定义角色的专业领域、说话风格、价值观等</li>
              <li>• 创建成功后可以在角色列表中找到并开始对话</li>
            </ul>
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.system_prompt.trim()}
              className="btn-primary flex-1"
            >
              {isLoading ? '创建中...' : '创建角色'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCharacterModal;