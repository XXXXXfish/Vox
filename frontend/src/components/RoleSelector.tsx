import React from 'react';
import { Bot, GraduationCap, Users, BookOpen, Wrench } from 'lucide-react';
import type { Role } from '../types';

interface RoleSelectorProps {
  roles: Role[];
  selectedRole: Role | null;
  onRoleSelect: (role: Role) => void;
  loading?: boolean;
}

// 角色图标映射
const getRoleIcon = (roleName: string) => {
  const name = roleName.toLowerCase();
  if (name.includes('助手') || name.includes('assistant')) {
    return <Bot className="w-5 h-5" />;
  } else if (name.includes('学习') || name.includes('导师') || name.includes('teacher')) {
    return <GraduationCap className="w-5 h-5" />;
  } else if (name.includes('创意') || name.includes('伙伴') || name.includes('creative')) {
    return <Users className="w-5 h-5" />;
  } else if (name.includes('语言') || name.includes('language')) {
    return <BookOpen className="w-5 h-5" />;
  } else if (name.includes('技术') || name.includes('tech')) {
    return <Wrench className="w-5 h-5" />;
  }
  return <Bot className="w-5 h-5" />;
};

const RoleSelector: React.FC<RoleSelectorProps> = ({
  roles,
  selectedRole,
  onRoleSelect,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="role-item">
              <div className="w-10 h-10 rounded-full transition-colors duration-200 dark:bg-gray-700 light:bg-gray-300"></div>
              <div className="flex-1">
                <div className="h-4 rounded mb-2 transition-colors duration-200 dark:bg-gray-700 light:bg-gray-300"></div>
                <div className="h-3 rounded w-3/4 transition-colors duration-200 dark:bg-gray-700 light:bg-gray-300"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {roles.map((role) => (
        <div
          key={role.ID}
          onClick={() => onRoleSelect(role)}
          className={`role-item ${
            selectedRole?.ID === role.ID ? 'role-item-selected' : ''
          }`}
        >
          {/* 角色图标 */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 dark:bg-gray-700 light:bg-gray-200 dark:text-gray-300 light:text-gray-600">
            {getRoleIcon(role.name)}
          </div>
          
          {/* 角色信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-1 truncate transition-colors duration-200 dark:text-white light:text-gray-900">
              {role.name}
            </h3>
            <p className="text-xs line-clamp-2 transition-colors duration-200 dark:text-gray-400 light:text-gray-600">
              {role.description}
            </p>
          </div>
        </div>
      ))}
      
      {roles.length === 0 && (
        <div className="text-center py-8 transition-colors duration-200 dark:text-gray-500 light:text-gray-600">
          <Bot className="w-12 h-12 mx-auto mb-3 transition-colors duration-200 dark:text-gray-600 light:text-gray-400" />
          <p className="text-sm">暂无可用角色</p>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
