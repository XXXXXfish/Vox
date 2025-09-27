import React from 'react';
import { Users, Sparkles } from 'lucide-react';
import type { Role } from '../types';

interface RoleSelectorProps {
  roles: Role[];
  selectedRole: Role | null;
  onRoleSelect: (role: Role) => void;
  loading?: boolean;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  roles,
  selectedRole,
  onRoleSelect,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold">选择角色</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg p-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-semibold">选择角色</h2>
        <Sparkles className="w-5 h-5 text-yellow-500" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div
            key={role.ID}
            onClick={() => onRoleSelect(role)}
            className={`
              relative cursor-pointer rounded-lg p-4 border-2 transition-all duration-200
              ${selectedRole?.ID === role.ID
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
              }
            `}
          >
            {/* 选中标识 */}
            {selectedRole?.ID === role.ID && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
            
            <div className="text-center">
              {/* 角色头像 */}
              <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gray-100">
                {role.avatar_url ? (
                  <img
                    src={role.avatar_url}
                    alt={role.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {role.name.charAt(0)}
                  </div>
                )}
              </div>
              
              {/* 角色名称 */}
              <h3 className="font-medium text-gray-900 mb-2">{role.name}</h3>
              
              {/* 角色描述 */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {role.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {roles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无可用角色</p>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
