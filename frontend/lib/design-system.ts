// Design System Tokens
// This file exports design tokens that can be used with CSS custom properties

export const colors = {
  // Primary Palette
  primary: {
    50: 'var(--color-primary-50)',
    100: 'var(--color-primary-100)',
    200: 'var(--color-primary-200)',
    300: 'var(--color-primary-300)',
    400: 'var(--color-primary-400)',
    500: 'var(--color-primary-500)',
    600: 'var(--color-primary-600)',
    700: 'var(--color-primary-700)',
    800: 'var(--color-primary-800)',
    900: 'var(--color-primary-900)',
    950: 'var(--color-primary-950)',
  },

  // Secondary Palette
  secondary: {
    50: 'var(--color-secondary-50)',
    100: 'var(--color-secondary-100)',
    200: 'var(--color-secondary-200)',
    300: 'var(--color-secondary-300)',
    400: 'var(--color-secondary-400)',
    500: 'var(--color-secondary-500)',
    600: 'var(--color-secondary-600)',
    700: 'var(--color-secondary-700)',
    800: 'var(--color-secondary-800)',
    900: 'var(--color-secondary-900)',
    950: 'var(--color-secondary-950)',
  },

  // Accent Palette
  accent: {
    50: 'var(--color-accent-50)',
    100: 'var(--color-accent-100)',
    200: 'var(--color-accent-200)',
    300: 'var(--color-accent-300)',
    400: 'var(--color-accent-400)',
    500: 'var(--color-accent-500)',
    600: 'var(--color-accent-600)',
    700: 'var(--color-accent-700)',
    800: 'var(--color-accent-800)',
    900: 'var(--color-accent-900)',
    950: 'var(--color-accent-950)',
  },

  // Sidebar Palette
  sidebar: {
    50: 'var(--color-sidebar-50)',
    100: 'var(--color-sidebar-100)',
    200: 'var(--color-sidebar-200)',
    300: 'var(--color-sidebar-300)',
    400: 'var(--color-sidebar-400)',
    500: 'var(--color-sidebar-500)',
    600: 'var(--color-sidebar-600)',
    700: 'var(--color-sidebar-700)',
    800: 'var(--color-sidebar-800)',
    900: 'var(--color-sidebar-900)',
    950: 'var(--color-sidebar-950)',
  },

  // Border Palette
  border: {
    50: 'var(--color-border-50)',
    100: 'var(--color-border-100)',
    200: 'var(--color-border-200)',
    300: 'var(--color-border-300)',
    400: 'var(--color-border-400)',
    500: 'var(--color-border-500)',
    600: 'var(--color-border-600)',
    700: 'var(--color-border-700)',
    800: 'var(--color-border-800)',
    900: 'var(--color-border-900)',
    950: 'var(--color-border-950)',
  },

  // Text Palette
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    tertiary: 'var(--color-text-tertiary)',
    inverse: 'var(--color-text-inverse)',
  },

  // Status Palette
  status: {
    success: 'var(--color-status-success)',
    warning: 'var(--color-status-warning)',
    error: 'var(--color-status-error)',
    info: 'var(--color-status-info)',
  },

  // Semantic Surface Palette
  semantic: {
    surface: {
      primary: 'var(--color-surface-primary)',
      secondary: 'var(--color-surface-secondary)',
      tertiary: 'var(--color-surface-tertiary)',
      quaternary: 'var(--color-surface-quaternary)',
    },
    background: {
      primary: 'var(--color-background-primary)',
      secondary: 'var(--color-background-secondary)',
    },
  },
};

export const spacing = {
  0: 'var(--spacing-0)',
  1: 'var(--spacing-1)',
  2: 'var(--spacing-2)',
  3: 'var(--spacing-3)',
  4: 'var(--spacing-4)',
  5: 'var(--spacing-5)',
  6: 'var(--spacing-6)',
  8: 'var(--spacing-8)',
  10: 'var(--spacing-10)',
  12: 'var(--spacing-12)',
  16: 'var(--spacing-16)',
  20: 'var(--spacing-20)',
  24: 'var(--spacing-24)',
  32: 'var(--spacing-32)',
  40: 'var(--spacing-40)',
  48: 'var(--spacing-48)',
  56: 'var(--spacing-56)',
  64: 'var(--spacing-64)',
};

export const typography = {
  fontFamily: {
    sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'ui-monospace, SFMono-Regular, "Menlo", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    base: 'var(--font-size-base)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
    '3xl': 'var(--font-size-3xl)',
    '4xl': 'var(--font-size-4xl)',
    '5xl': 'var(--font-size-5xl)',
    '6xl': 'var(--font-size-6xl)',
    '7xl': 'var(--font-size-7xl)',
    '8xl': 'var(--font-size-8xl)',
    '9xl': 'var(--font-size-9xl)',
  },
  fontWeight: {
    thin: 'var(--font-weight-thin)',
    extralight: 'var(--font-weight-extralight)',
    light: 'var(--font-weight-light)',
    normal: 'var(--font-weight-normal)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
    extrabold: 'var(--font-weight-extrabold)',
    black: 'var(--font-weight-black)',
  },
  lineHeight: {
    none: 'var(--line-height-none)',
    tight: 'var(--line-height-tight)',
    snug: 'var(--line-height-snug)',
    normal: 'var(--line-height-normal)',
    relaxed: 'var(--line-height-relaxed)',
    loose: 'var(--line-height-loose)',
  },
  letterSpacing: {
    tighter: 'var(--letter-spacing-tighter)',
    tight: 'var(--letter-spacing-tight)',
    normal: 'var(--letter-spacing-normal)',
    wide: 'var(--letter-spacing-wide)',
    wider: 'var(--letter-spacing-wider)',
    widest: 'var(--letter-spacing-widest)',
  },
};

export const borders = {
  radius: {
    none: 'var(--border-radius-none)',
    sm: 'var(--border-radius-sm)',
    base: 'var(--border-radius-base)',
    md: 'var(--border-radius-md)',
    lg: 'var(--border-radius-lg)',
    xl: 'var(--border-radius-xl)',
    '2xl': 'var(--border-radius-2xl)',
    '3xl': 'var(--border-radius-3xl)',
    full: 'var(--border-radius-full)',
  },
  width: {
    0: 'var(--border-width-0)',
    1: 'var(--border-width-1)',
    2: 'var(--border-width-2)',
    4: 'var(--border-width-4)',
    8: 'var(--border-width-8)',
  },
};

export const shadows = {
  sm: 'var(--shadow-sm)',
  base: 'var(--shadow-base)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  '2xl': 'var(--shadow-2xl)',
  inner: 'var(--shadow-inner)',
  none: 'var(--shadow-none)',
};

export const transitions = {
  duration: {
    75: 'var(--transition-duration-75)',
    100: 'var(--transition-duration-100)',
    150: 'var(--transition-duration-150)',
    200: 'var(--transition-duration-200)',
    300: 'var(--transition-duration-300)',
    500: 'var(--transition-duration-500)',
    700: 'var(--transition-duration-700)',
    1000: 'var(--transition-duration-1000)',
  },
  easing: {
    linear: 'var(--transition-easing-linear)',
    in: 'var(--transition-easing-in)',
    out: 'var(--transition-easing-out)',
    'in-out': 'var(--transition-easing-in-out)',
  },
  common: {
    fast: 'var(--transition-duration-150) var(--transition-easing-out)',
    normal: 'var(--transition-duration-200) var(--transition-easing-in-out)',
    slow: 'var(--transition-duration-300) var(--transition-easing-in-out)',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  dropdown: 'var(--z-index-dropdown)',
  sticky: 'var(--z-index-sticky)',
  fixed: 'var(--z-index-fixed)',
  modalBackdrop: 'var(--z-index-modal-backdrop)',
  modal: 'var(--z-index-modal)',
  popover: 'var(--z-index-popover)',
  tooltip: 'var(--z-index-tooltip)',
  toast: 'var(--z-index-toast)',
};

// Component-specific tokens
export const components = {
  card: {
    background: 'var(--color-surface-primary)',
    border: 'var(--color-border-500)',
    borderRadius: 'var(--border-radius-lg)',
    padding: 'var(--spacing-6)',
    shadow: 'var(--shadow-md)',
  },
  button: {
    primary: {
      background: 'var(--color-primary-500)',
      color: 'var(--color-text-inverse)',
      border: 'none',
      borderRadius: 'var(--border-radius-md)',
      padding: 'var(--spacing-2) var(--spacing-4)',
      fontWeight: 'var(--font-weight-medium)',
      transition: 'var(--transition-common-normal)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-500)',
      borderRadius: 'var(--border-radius-md)',
      padding: 'var(--spacing-2) var(--spacing-4)',
      fontWeight: 'var(--font-weight-medium)',
      transition: 'var(--transition-common-normal)',
    },
    danger: {
      background: 'var(--color-status-error)',
      color: 'white',
      border: 'none',
      borderRadius: 'var(--border-radius-md)',
      padding: 'var(--spacing-2) var(--spacing-4)',
      fontWeight: 'var(--font-weight-medium)',
      transition: 'var(--transition-common-normal)',
    },
  },
  input: {
    background: 'var(--color-surface-secondary)',
    border: '1px solid var(--color-border-500)',
    color: 'var(--color-text-primary)',
    borderRadius: 'var(--border-radius-md)',
    padding: 'var(--spacing-2) var(--spacing-3)',
    transition: 'var(--transition-common-fast)',
  },
  sidebar: {
    background: 'var(--color-sidebar-500)',
    border: 'var(--color-border-500)',
    text: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    active: 'var(--color-surface-tertiary)',
    hover: 'var(--color-surface-secondary)',
  },
};

// Utility functions
export const withOpacity = (color: string, opacity: number) => {
  // For CSS variables, we can use opacity modifier
  return `${color} / ${opacity}`;
};

export const responsive = (base: string, _variants: Record<string, string>) => {
  // This would need to be implemented differently for CSS variables
  return base;
};

// Export all tokens
const designTokens = {
  colors,
  spacing,
  typography,
  borders,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  components,
  withOpacity,
  responsive,
};

export default designTokens;
