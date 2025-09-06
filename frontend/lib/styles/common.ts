/**
 * Centralized Styling System for SoulPath
 * 
 * This file contains reusable style combinations and utility functions
 * that build upon the design system tokens.
 * 
 * Usage:
 * import { cardStyles, buttonStyles, inputStyles } from '@/lib/styles/common';
 */



// Common Style Combinations
// This file contains reusable style combinations using CSS custom properties

// Card Styles
export const cardStyles = {
  base: 'bg-[var(--color-surface-primary)] border border-[var(--color-border-500)] rounded-[var(--border-radius-lg)]',
  variants: {
    default: 'bg-[var(--color-surface-primary)] border border-[var(--color-border-500)] rounded-[var(--border-radius-lg)]',
    elevated: 'bg-[var(--color-surface-primary)] border border-[var(--color-border-500)] rounded-[var(--border-radius-lg)] shadow-[var(--shadow-md)]',
    interactive: 'bg-[var(--color-surface-primary)] border border-[var(--color-border-500)] rounded-[var(--border-radius-lg)] hover:bg-[var(--color-surface-secondary)] transition-all duration-200',
    ghost: 'bg-transparent border-none',
    outlined: 'bg-transparent border border-[var(--color-border-500)] rounded-[var(--border-radius-lg)]',
  },
  sizes: {
    sm: 'p-[var(--spacing-3)]',
    md: 'p-[var(--spacing-4)]',
    lg: 'p-[var(--spacing-6)]',
    xl: 'p-[var(--spacing-8)]',
  },
  states: {
    hover: 'hover:bg-[var(--color-surface-secondary)]',
    focus: 'focus:ring-2 focus:ring-[var(--color-accent-500)] focus:ring-offset-2',
    active: 'active:scale-95',
  },
};

// Button Styles
export const buttonStyles = {
  base: 'inline-flex items-center justify-center font-[var(--font-weight-medium)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-500)] focus:ring-offset-2 focus:ring-offset-[var(--color-background-primary)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95',
  variants: {
    primary: 'bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 active:bg-[#FFD700]/80 border-2 border-[#FFD700] rounded-[var(--border-radius-md)] shadow-lg shadow-[#FFD700]/30 font-[var(--font-weight-semibold)] hover:shadow-xl hover:shadow-[#FFD700]/40 focus:ring-4 focus:ring-[#FFD700]/30 focus:border-[#FFD700]',
    secondary: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] border border-[var(--color-border-500)] rounded-[var(--border-radius-md)]',
    outline: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] border border-[var(--color-border-500)] rounded-[var(--border-radius-md)]',
    danger: 'bg-[var(--color-status-error)] text-white hover:bg-red-600 border-none rounded-[var(--border-radius-md)]',
    success: 'bg-[var(--color-status-success)] text-white hover:bg-green-600 border-none rounded-[var(--border-radius-md)]',
    warning: 'bg-[var(--color-status-warning)] text-white hover:bg-yellow-600 border-none rounded-[var(--border-radius-md)]',
    info: 'bg-[var(--color-status-info)] text-white hover:bg-blue-600 border-none rounded-[var(--border-radius-md)]',
    ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] border-none rounded-[var(--border-radius-md)]',
  },
  sizes: {
    xs: 'px-[var(--spacing-1)] py-[var(--spacing-0.5)] text-[var(--font-size-xs)]',
    sm: 'px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-sm)]',
    md: 'px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-base)]',
    lg: 'px-[var(--spacing-6)] py-[var(--spacing-3)] text-[var(--font-size-lg)]',
    xl: 'px-[var(--spacing-8)] py-[var(--spacing-4)] text-[var(--font-size-xl)]',
    login: 'px-[var(--spacing-6)] py-[var(--spacing-4)] text-[var(--font-size-lg)]',
  },
  states: {
    loading: 'opacity-75 cursor-wait',
    disabled: 'opacity-50 cursor-not-allowed',
  },
};

// Sidebar Navigation Button Styles
export const sidebarButtonStyles = {
  base: 'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
  variants: {
    active: 'bg-[var(--color-accent-500)] text-black',
    inactive: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-sidebar-700)] hover:text-[var(--color-text-primary)]',
  },
  icon: 'w-5 h-5',
  label: 'font-medium',
};

// Header Button Styles for Admin Dashboard
export const headerButtonStyles = {
  base: 'inline-flex items-center justify-center font-[var(--font-weight-medium)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-500)] focus:ring-offset-2 focus:ring-offset-[var(--color-background-primary)] disabled:opacity-50 disabled:cursor-not-allowed',
  variants: {
    primary: 'bg-[var(--color-accent-500)] text-black hover:bg-[var(--color-accent-500)]/90 active:bg-[var(--color-accent-500)]/80 border-2 border-[var(--color-accent-500)] rounded-[var(--border-radius-md)] shadow-lg shadow-[var(--color-accent-500)]/30 font-[var(--font-weight-semibold)] hover:shadow-xl hover:shadow-[var(--color-accent-500)]/40 focus:ring-4 focus:ring-[var(--color-accent-500)]/30 focus:border-[var(--color-accent-500)]',
    secondary: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] border border-[var(--color-border-500)] rounded-[var(--border-radius-md)]',
    outline: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] border border-[var(--color-border-500)] rounded-[var(--border-radius-md)]',
    danger: 'bg-[var(--color-status-error)] text-white hover:bg-red-600 border-none rounded-[var(--border-radius-md)]',
    success: 'bg-[var(--color-status-success)] text-white hover:bg-green-600 border-none rounded-[var(--border-radius-md)]',
    warning: 'bg-[var(--color-status-warning)] text-white hover:bg-yellow-600 border-none rounded-[var(--border-radius-md)]',
    info: 'bg-[var(--color-status-info)] text-white hover:bg-blue-600 border-none rounded-[var(--border-radius-md)]',
    ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] border-none rounded-[var(--border-radius-md)]',
  },
  sizes: {
    xs: 'px-[var(--spacing-1)] py-[var(--spacing-0.5)] text-[var(--font-size-xs)]',
    sm: 'px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-sm)]',
    md: 'px-[var(--spacing-4)] py-[var(--spacing-2)] text-[var(--font-size-base)]',
    lg: 'px-[var(--spacing-6)] py-[var(--spacing-3)] text-[var(--font-size-lg)]',
    xl: 'px-[var(--spacing-8)] py-[var(--spacing-4)] text-[var(--font-size-xl)]',
    login: 'px-[var(--spacing-6)] py-[var(--spacing-4)] text-[var(--font-size-lg)]',
  },
  states: {
    loading: 'opacity-75 cursor-wait',
    disabled: 'opacity-50 cursor-not-allowed',
  },
};

// Input Styles
export const inputStyles = {
  base: 'bg-[var(--color-surface-secondary)] border border-[var(--color-border-500)] text-[var(--color-text-primary)] rounded-[var(--border-radius-md)] px-[var(--spacing-3)] py-[var(--spacing-2)] transition-all duration-200',
  variants: {
    default: 'bg-[var(--color-surface-secondary)] border border-[var(--color-border-500)] text-[var(--color-text-primary)] rounded-[var(--border-radius-md)]',
    focus: 'bg-[var(--color-surface-secondary)] border border-[var(--color-accent-500)] text-[var(--color-text-primary)] rounded-[var(--border-radius-md)]',
    success: 'bg-[var(--color-surface-secondary)] border border-[var(--color-status-success)] text-[var(--color-text-primary)] rounded-[var(--border-radius-md)]',
    error: 'bg-[var(--color-surface-secondary)] border border-[var(--color-status-error)] text-[var(--color-text-primary)] rounded-[var(--border-radius-md)]',
    disabled: 'bg-[var(--color-surface-quaternary)] border border-[var(--color-border-400)] text-[var(--color-text-tertiary)] rounded-[var(--border-radius-md)] cursor-not-allowed',
  },
  sizes: {
    sm: 'px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-sm)]',
    md: 'px-[var(--spacing-3)] py-[var(--spacing-2)] text-[var(--font-size-base)]',
    lg: 'px-[var(--spacing-4)] py-[var(--spacing-3)] text-[var(--font-size-lg)]',
  },
};

// Select Styles
export const selectStyles = {
  trigger: 'bg-[var(--color-surface-secondary)] border border-[var(--color-border-500)] text-[var(--color-text-primary)] rounded-[var(--border-radius-md)] px-[var(--spacing-3)] py-[var(--spacing-2)] transition-all duration-200',
  content: 'bg-[var(--color-surface-secondary)] border border-[var(--color-border-500)] rounded-[var(--border-radius-md)]',
  item: 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] px-[var(--spacing-3)] py-[var(--spacing-2)]',
};

// Badge Styles
export const badgeStyles = {
  default: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] rounded-[var(--border-radius-full)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-xs)] font-[var(--font-weight-medium)]',
  success: 'bg-[var(--color-status-success)] text-white rounded-[var(--border-radius-full)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-xs)] font-[var(--font-weight-medium)]',
  warning: 'bg-[var(--color-status-warning)] text-white rounded-[var(--border-radius-full)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-xs)] font-[var(--font-weight-medium)]',
  error: 'bg-[var(--color-status-error)] text-white rounded-[var(--border-radius-full)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-xs)] font-[var(--font-weight-medium)]',
  info: 'bg-[var(--color-status-info)] text-white rounded-[var(--border-radius-full)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-xs)] font-[var(--font-weight-medium)]',
};

// Layout Styles
export const layoutStyles = {
  container: 'max-w-7xl mx-auto px-[var(--spacing-4)] sm:px-[var(--spacing-6)] lg:px-[var(--spacing-8)]',
  section: 'py-[var(--spacing-12)] sm:py-[var(--spacing-16)] lg:py-[var(--spacing-20)]',
  grid: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    },
    gaps: {
      sm: 'gap-[var(--spacing-2)]',
      md: 'gap-[var(--spacing-4)]',
      lg: 'gap-[var(--spacing-6)]',
      xl: 'gap-[var(--spacing-8)]',
    },
  },
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    row: 'flex flex-row',
  },
  spacing: {
    stack: {
      sm: 'space-y-[var(--spacing-2)]',
      md: 'space-y-[var(--spacing-4)]',
      lg: 'space-y-[var(--spacing-6)]',
      xl: 'space-y-[var(--spacing-8)]',
    },
    inline: {
      sm: 'space-x-[var(--spacing-2)]',
      md: 'space-x-[var(--spacing-4)]',
      lg: 'space-x-[var(--spacing-6)]',
      xl: 'space-x-[var(--spacing-8)]',
    },
  },
};

// Animation Styles
export const animationStyles = {
  fadeIn: 'animate-in fade-in duration-300',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  slideUp: 'animate-in slide-in-from-top-4 duration-300',
  slideDown: 'animate-in slide-in-from-bottom-4 duration-300',
  slideLeft: 'animate-in slide-in-from-right-4 duration-300',
  slideRight: 'animate-in slide-in-from-left-4 duration-300',
};

// Utility Functions
export const combineStyles = (...styles: (string | undefined | null | false)[]): string => {
  return styles.filter(Boolean).join(' ');
};

export const conditionalStyles = (condition: boolean, trueStyle: string, falseStyle: string = ''): string => {
  return condition ? trueStyle : falseStyle;
};

export const responsiveStyles = (base: string, _variants: Record<string, string>): string => {
  // For now, return base styles. This could be enhanced with responsive variants
  return base;
};

// Export all styles
const commonStyles = {
  cardStyles,
  buttonStyles,
  inputStyles,
  selectStyles,
  badgeStyles,
  layoutStyles,
  animationStyles,
  combineStyles,
  conditionalStyles,
  responsiveStyles,
};

export default commonStyles;
