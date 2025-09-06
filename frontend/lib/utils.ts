import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a date string or Date object
 * Returns a formatted date string or "N/A" if the date is invalid
 */
export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return "N/A";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "N/A";
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return dateObj.toLocaleDateString(undefined, defaultOptions);
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return "N/A";
  }
}

/**
 * Safely formats a time string
 * Returns a formatted time string or "N/A" if the time is invalid
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "N/A";
  
  try {
    // Handle time strings in HH:MM format
    if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Handle other time formats
    const timeObj = new Date(`2000-01-01T${time}`);
    if (isNaN(timeObj.getTime())) {
      return "N/A";
    }
    
    return timeObj.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.warn('Error formatting time:', time, error);
    return "N/A";
  }
}

/**
 * Safely formats a datetime string
 * Returns a formatted datetime string or "N/A" if the datetime is invalid
 */
export function formatDateTime(datetime: string | Date | null | undefined): string {
  if (!datetime) return "N/A";
  
  try {
    const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "N/A";
    }
    
    return dateObj.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.warn('Error formatting datetime:', datetime, error);
    return "N/A";
  }
}

/**
 * Safely formats a currency amount
 * Returns a formatted currency string or "N/A" if the amount is invalid
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "N/A";
  }
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.warn('Error formatting currency:', amount, currency, error);
    return `$${amount.toFixed(2)}`;
  }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
