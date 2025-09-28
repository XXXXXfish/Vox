import { useState, useEffect, useCallback } from 'react';
import { fetchRoles } from '../services/api';
import type { Role } from '../types';

interface UseRolesReturn {
  roles: Role[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRoles = (): UseRolesReturn => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const rolesData = await fetchRoles();
      setRoles(rolesData.data);
    } catch (err) {
      console.error('加载角色列表失败:', err);
      setError(err instanceof Error ? err.message : '加载角色列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return {
    roles,
    loading,
    error,
    refetch,
  };
};
