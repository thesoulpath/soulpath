import { z } from 'zod';
import { toast } from 'sonner';

// Generic API response handler
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: string;
}

// Validation error handler
export function handleValidationError(error: z.ZodError): string[] {
  return (error as any).errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
}

// API response handler with toast notifications
export async function handleApiResponse<T>(
  response: Response,
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();
    
    if (response.ok) {
      const message = successMessage || data.message || 'Operation completed successfully';
      toast.success(message);
      return {
        success: true,
        message,
        data: data.data || data
      };
    } else {
      const message = errorMessage || data.error || data.message || 'Operation failed';
      toast.error(message);
      return {
        success: false,
        message: message,
        error: message,
        details: data.details
      };
    }
  } catch (error) {
    const message = 'Network error occurred';
    toast.error(message);
    return {
      success: false,
      message: message,
      error: message,
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Generic API request handler
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  successMessage?: string,
  errorMessage?: string
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    return await handleApiResponse<T>(response, successMessage, errorMessage);
  } catch (error) {
    const message = 'Network error occurred';
    toast.error(message);
    return {
      success: false,
      message: message,
      error: message,
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Confirmation dialog utility
export function confirmAction(
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  if (window.confirm(message)) {
    onConfirm();
  } else if (onCancel) {
    onCancel();
  }
}

// Success toast with action
export function showSuccessToast(message: string, action?: { label: string; onClick: () => void }) {
  if (action) {
    toast.success(message, {
      action: {
        label: action.label,
        onClick: action.onClick,
      },
    });
  } else {
    toast.success(message);
  }
}

// Error toast with retry option
export function showErrorToast(message: string, retryAction?: () => void) {
  if (retryAction) {
    toast.error(message, {
      action: {
        label: 'Retry',
        onClick: retryAction,
      },
    });
  } else {
    toast.error(message);
  }
}

// Loading toast
export function showLoadingToast(message: string) {
  return toast.loading(message);
}

// Dismiss loading toast
export function dismissLoadingToast(toastId: string | number) {
  toast.dismiss(toastId);
}

// Form validation helper
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = handleValidationError(error);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Safe JSON parsing
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Format error message for display
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  if (error && typeof error === 'object' && 'error' in error && typeof error.error === 'string') return error.error;
  return 'An unexpected error occurred';
}

// Debounce utility for search inputs
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Format date for display
export function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
}

// Format time for display
export function formatTime(time: string): string {
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return time;
  }
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Check if object is empty
export function isEmpty(obj: unknown): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (obj instanceof Map || obj instanceof Set) return obj.size === 0;
  if (typeof obj === 'object') return Object.keys(obj as Record<string, unknown>).length === 0;
  return false;
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * Utility function for making authenticated API calls to admin endpoints
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}, 
  accessToken?: string
): Promise<Response> {
  if (!accessToken) {
    throw new Error('Access token is required for admin API calls');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
