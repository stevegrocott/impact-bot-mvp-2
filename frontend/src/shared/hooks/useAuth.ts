import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { loginStart, loginSuccess, loginFailure, logout } from '../store/authSlice';
import { apiClient } from '../services/apiClient';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, organization, token, isAuthenticated, permissions, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const login = useCallback(async (email: string, password: string) => {
    try {
      dispatch(loginStart());
      const response = await apiClient.login(email, password);
      
      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('auth_token', response.data?.token);
        
        dispatch(loginSuccess(response.data));
        return { success: true };
      } else {
        dispatch(loginFailure(response.message || 'Login failed'));
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      dispatch(loginFailure(error.message));
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  const logoutUser = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      dispatch(logout());
    }
  }, [dispatch]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { isAuthenticated: false };
    }

    try {
      const response = await apiClient.getCurrentUser();
      if (response.success) {
        dispatch(loginSuccess({
          user: response.data?.user,
          organization: response.data?.organization,
          token,
          permissions: response.data?.permissions || [],
        }));
        return { isAuthenticated: true };
      } else {
        localStorage.removeItem('auth_token');
        dispatch(logout());
        return { isAuthenticated: false };
      }
    } catch (error) {
      localStorage.removeItem('auth_token');
      dispatch(logout());
      return { isAuthenticated: false };
    }
  }, [dispatch]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!permissions || !Array.isArray(permissions)) {
      return false;
    }
    return permissions.includes(permission) || permissions.includes('admin');
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const getUserComplexityPreference = useCallback((): number => {
    if (!user?.preferences) return 2; // Default to intermediate
    
    const pref = user?.preferences?.complexity_preference;
    if (typeof pref === 'string') {
      const mapping = { basic: 1, intermediate: 2, advanced: 3 };
      return mapping[pref as keyof typeof mapping] || 2;
    }
    return typeof pref === 'number' ? pref : 2;
  }, [user]);

  const getOrganizationContext = useCallback(() => {
    if (!organization) return {};
    
    return {
      id: organization?.id,
      name: organization?.name,
      industry: organization?.industry,
      sizeCategory: organization?.sizeCategory,
      focusAreas: organization?.focusAreas || [],
      complexity_preference: getUserComplexityPreference(),
    };
  }, [organization, getUserComplexityPreference]);

  return {
    // State
    user,
    organization,
    token,
    isAuthenticated,
    permissions,
    isLoading,
    error,
    
    // Actions
    login,
    logout: logoutUser,
    checkAuth,
    
    // Helpers
    hasPermission,
    hasAnyPermission,
    getUserComplexityPreference,
    getOrganizationContext,
  };
};