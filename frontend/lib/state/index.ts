/**
 * Centralized State Management for SoulPath
 * 
 * This file provides centralized state management, shared hooks,
 * and consistent data fetching patterns across the application.
 * 
 * Usage:
 * import { useClients, useBookings, usePackages } from '@/lib/state';
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseApiOptions {
  immediate?: boolean;
  cache?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

// ============================================================================
// GENERIC API HOOK
// ============================================================================

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const { immediate = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (response.success && response.data) {
        setData(response.data);
        onSuccess?.(response.data);
      } else {
        const errorMessage = response.error || response.message || 'Failed to fetch data';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate && !isInitialized) {
      fetchData();
    }
  }, [immediate, isInitialized, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// CLIENTS STATE MANAGEMENT
// ============================================================================

export function useClients(options: UseApiOptions = {}) {
  return useApi(() => api.clients.getAll({ enhanced: true }), options);
}

export function useClient(id: string, options: UseApiOptions = {}) {
  return useApi(() => api.clients.getById(id), options);
}

export function useCreateClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClient = useCallback(async (clientData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.clients.create(clientData);
      
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.error || response.message || 'Failed to create client';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createClient,
    loading,
    error,
  };
}

export function useUpdateClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateClient = useCallback(async (id: string, clientData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.clients.update(id, clientData);
      
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.error || response.message || 'Failed to update client';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateClient,
    loading,
    error,
  };
}

export function useDeleteClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteClient = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.clients.delete(id);
      
      if (response.success) {
        return true;
      } else {
        const errorMessage = response.error || response.message || 'Failed to delete client';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteClient,
    loading,
    error,
  };
}

// ============================================================================
// BOOKINGS STATE MANAGEMENT
// ============================================================================

export function useBookings(params?: any, options: UseApiOptions = {}) {
  return useApi(() => api.bookings.getAll(params), options);
}

export function useCreateBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useCallback(async (bookingData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.bookings.create(bookingData);
      
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.error || response.message || 'Failed to create booking';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createBooking,
    loading,
    error,
  };
}

// ============================================================================
// PACKAGES STATE MANAGEMENT
// ============================================================================

export function usePackages(options: UseApiOptions = {}) {
  return useApi(() => api.packages.getAll(), options);
}

export function useCreatePackage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPackage = useCallback(async (packageData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.packages.create(packageData);
      
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.error || response.message || 'Failed to create package';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createPackage,
    loading,
    error,
  };
}

// ============================================================================
// DASHBOARD STATE MANAGEMENT
// ============================================================================

export function useDashboardStats(options: UseApiOptions = {}) {
  return useApi(() => api.dashboard.getStats(), options);
}

// ============================================================================
// GLOBAL STATE MANAGEMENT
// ============================================================================

export interface GlobalState {
  theme: 'light' | 'dark';
  language: 'en' | 'es';
  sidebarCollapsed: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const initialState: GlobalState = {
  theme: 'dark',
  language: 'en',
  sidebarCollapsed: false,
  notifications: [],
};

export function useGlobalState() {
  const [state, setState] = useState<GlobalState>(initialState);

  const updateState = useCallback((updates: Partial<GlobalState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed,
    }));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...prev.notifications],
    }));
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      ),
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
    }));
  }, []);

  return {
    ...state,
    updateState,
    toggleTheme,
    toggleSidebar,
    addNotification,
    markNotificationAsRead,
    clearNotifications,
  };
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export function useCache() {
  const clearAllCache = useCallback(() => {
    api.clients.clearCache();
    api.bookings.clearCache();
    api.packages.clearCache();
    api.dashboard.clearCache();
  }, []);

  const clearCacheByKey = useCallback((key: string) => {
    if (key.startsWith('clients:')) {
      api.clients.clearCache(key);
    } else if (key.startsWith('bookings:')) {
      api.bookings.clearCache(key);
    } else if (key.startsWith('packages:')) {
      api.packages.clearCache(key);
    } else if (key.startsWith('dashboard:')) {
      api.dashboard.clearCache(key);
    }
  }, []);

  return {
    clearAllCache,
    clearCacheByKey,
  };
}

// ============================================================================
// EXPORT ALL HOOKS
// ============================================================================

const stateHooks = {
  // Generic
  useApi,
  
  // Clients
  useClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  
  // Bookings
  useBookings,
  useCreateBooking,
  
  // Packages
  usePackages,
  useCreatePackage,
  
  // Dashboard
  useDashboardStats,
  
  // Global
  useGlobalState,
  useCache,
};

export default stateHooks;
