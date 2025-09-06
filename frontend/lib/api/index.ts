/**
 * Centralized API Layer for SoulPath
 * 
 * This file provides a centralized way to handle all API calls
 * with consistent error handling, request/response types, and caching.
 * 
 * Usage:
 * import { api } from '@/lib/api';
 * 
 * const clients = await api.clients.getAll();
 * const newClient = await api.clients.create(clientData);
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | number | boolean | undefined;
}

// Data interfaces
export interface ClientData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  language?: string;
  status?: string;
  [key: string]: unknown;
}

export interface BookingData {
  id?: string;
  clientId: string;
  packageId: string;
  scheduleSlotId: string;
  birthData?: {
    date: string;
    city: string;
    time?: string;
  };
  message?: string;
  [key: string]: unknown;
}

export interface PackageData {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  sessionsCount: number;
  [key: string]: unknown;
}

// ============================================================================
// BASE API CLIENT
// ============================================================================

class ApiClient {
  private supabase = createClient();
  private cache = new Map<string, { data: ApiResponse<unknown>; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Make an authenticated API request
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Get the current session
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'API request failed',
        data: undefined,
      } as ApiResponse<T>;
    }
  }

  /**
   * Get cached data or fetch from API
   */
  protected async getCachedOrFetch<T>(
    key: string,
    fetcher: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      return cached.data as ApiResponse<T>;
    }

    const result = await fetcher();
    
    if (result.success) {
      this.cache.set(key, { data: result, timestamp: now });
    }

    return result;
  }

  /**
   * Clear cache for a specific key or all cache
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// ============================================================================
// CLIENTS API
// ============================================================================

class ClientsApi extends ApiClient {
  private baseUrl = '/api/admin/clients';

  /**
   * Get all clients with optional filters
   */
  async getAll(params?: {
    enhanced?: boolean;
    email?: string;
    status?: string;
    language?: string;
    hasActivePackages?: boolean;
  }): Promise<ApiResponse<ClientData[]>> {
    const searchParams = new URLSearchParams();
    
    if (params?.enhanced) searchParams.append('enhanced', 'true');
    if (params?.email) searchParams.append('email', params.email);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.language) searchParams.append('language', params.language);
    if (params?.hasActivePackages !== undefined) {
      searchParams.append('has_active_packages', params.hasActivePackages.toString());
    }

    const url = `${this.baseUrl}?${searchParams.toString()}`;
    return this.getCachedOrFetch(`clients:all:${url}`, () => 
      this.request(url)
    );
  }

  /**
   * Get a single client by ID
   */
  async getById(id: string): Promise<ApiResponse<ClientData>> {
    return this.getCachedOrFetch(`clients:${id}`, () => 
      this.request(`${this.baseUrl}/${id}`)
    );
  }

  /**
   * Create a new client
   */
  async create(clientData: Omit<ClientData, 'id'>): Promise<ApiResponse<ClientData>> {
    const result = await this.request(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(clientData),
    });

    if (result.success) {
      this.clearCache('clients:all');
    }

    return result as ApiResponse<ClientData>;
  }

  /**
   * Update an existing client
   */
  async update(id: string, clientData: Partial<ClientData>): Promise<ApiResponse<ClientData>> {
    const result = await this.request(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });

    if (result.success) {
      this.clearCache(`clients:${id}`);
      this.clearCache('clients:all');
    }

    return result as ApiResponse<ClientData>;
  }

  /**
   * Delete a client
   */
  async delete(id: string): Promise<ApiResponse<any>> {
    const result = await this.request(`${this.baseUrl}?id=${id}`, {
      method: 'DELETE',
    });

    if (result.success) {
      this.clearCache(`clients:${id}`);
      this.clearCache('clients:all');
    }

    return result;
  }
}

// ============================================================================
// BOOKINGS API
// ============================================================================

class BookingsApi extends ApiClient {
  private baseUrl = '/api/admin/bookings';

  /**
   * Get all bookings with optional filters
   */
  async getAll(params?: {
    clientId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<BookingData[]>> {
    const searchParams = new URLSearchParams();
    
    if (params?.clientId) searchParams.append('clientId', params.clientId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo);

    const url = `${this.baseUrl}?${searchParams.toString()}`;
    return this.getCachedOrFetch(`bookings:all:${url}`, () => 
      this.request(url)
    );
  }

  /**
   * Create a new booking
   */
  async create(bookingData: Omit<BookingData, 'id'>): Promise<ApiResponse<BookingData>> {
    const result = await this.request(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });

    if (result.success) {
      this.clearCache('bookings:all');
    }

    return result as ApiResponse<BookingData>;
  }

  /**
   * Update an existing booking
   */
  async update(id: string, bookingData: Partial<BookingData>): Promise<ApiResponse<BookingData>> {
    const result = await this.request(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    });

    if (result.success) {
      this.clearCache(`bookings:${id}`);
      this.clearCache('bookings:all');
    }

    return result as ApiResponse<BookingData>;
  }

  /**
   * Delete a booking
   */
  async delete(id: string): Promise<ApiResponse<any>> {
    const result = await this.request(`${this.baseUrl}?id=${id}`, {
      method: 'DELETE',
    });

    if (result.success) {
      this.clearCache(`bookings:${id}`);
      this.clearCache('bookings:all');
    }

    return result;
  }
}

// ============================================================================
// PACKAGES API
// ============================================================================

class PackagesApi extends ApiClient {
  private baseUrl = '/api/admin/packages';

  /**
   * Get all packages
   */
  async getAll(): Promise<ApiResponse<PackageData[]>> {
    return this.getCachedOrFetch('packages:all', () => 
      this.request(this.baseUrl)
    );
  }

  /**
   * Create a new package
   */
  async create(packageData: Omit<PackageData, 'id'>): Promise<ApiResponse<PackageData>> {
    const result = await this.request(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(packageData),
    });

    if (result.success) {
      this.clearCache('packages:all');
    }

    return result as ApiResponse<PackageData>;
  }

  /**
   * Update an existing package
   */
  async update(id: string, packageData: Partial<PackageData>): Promise<ApiResponse<PackageData>> {
    const result = await this.request(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(packageData),
    });

    if (result.success) {
      this.clearCache(`packages:${id}`);
      this.clearCache('packages:all');
    }

    return result as ApiResponse<PackageData>;
  }

  /**
   * Delete a package
   */
  async delete(id: string): Promise<ApiResponse<any>> {
    const result = await this.request(`${this.baseUrl}?id=${id}`, {
      method: 'DELETE',
    });

    if (result.success) {
      this.clearCache(`packages:${id}`);
      this.clearCache('packages:all');
    }

    return result;
  }
}

// ============================================================================
// DASHBOARD API
// ============================================================================

class DashboardApi extends ApiClient {
  private baseUrl = '/api/client/dashboard-stats';

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.getCachedOrFetch('dashboard:stats', () => 
      this.request(this.baseUrl)
    );
  }
}

// ============================================================================
// MAIN API EXPORT
// ============================================================================

export const api = {
  clients: new ClientsApi(),
  bookings: new BookingsApi(),
  packages: new PackagesApi(),
  dashboard: new DashboardApi(),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a custom API endpoint
 */
export function createApiEndpoint<T>(baseUrl: string) {
  return {
    getAll: (params?: Record<string, string | number | boolean>) => {
      const searchParams = params ? new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ) : new URLSearchParams();
      return fetch(`${baseUrl}?${searchParams}`).then(res => res.json());
    },
    
    getById: (id: string) => 
      fetch(`${baseUrl}/${id}`).then(res => res.json()),
    
    create: (data: T) => 
      fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    
    update: (id: string, data: Partial<T>) => 
      fetch(`${baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    
    delete: (id: string) => 
      fetch(`${baseUrl}?id=${id}`, { method: 'DELETE' }).then(res => res.json()),
  };
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
      details: error.stack,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      status: 500,
    };
  }

  return {
    message: 'An unexpected error occurred',
    status: 500,
    details: error,
  };
}

export default api;
