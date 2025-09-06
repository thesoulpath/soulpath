/**
 * BaseButton Component
 * 
 * A centralized button component that uses the design system
 * for consistent styling across the application.
 * 
 * Usage:
 * import { BaseButton } from '@/components/ui/BaseButton';
 * 
 * <BaseButton variant="primary" size="md" loading={isLoading}>
 *   Click me
 * </BaseButton>
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { buttonStyles, combineStyles } from '@/lib/styles/common';
import { Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'login';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BaseButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  leftIcon,
  rightIcon,
  ...props
}: BaseButtonProps) {
  const baseClasses = buttonStyles.base;
  const variantClasses = buttonStyles.variants[variant];
  const sizeClasses = buttonStyles.sizes[size];
  
  const stateClasses = combineStyles(
    loading && buttonStyles.states.loading,
    disabled && buttonStyles.states.disabled
  );

  const classes = combineStyles(
    baseClasses,
    variantClasses,
    sizeClasses,
    stateClasses,
    className
  );

  const isDisabled = disabled || loading;

  return (
    <button
      className={classes}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      
      {!loading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      
      {children}
      
      {!loading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
}

// ============================================================================
// BUTTON GROUP COMPONENT
// ============================================================================

export interface BaseButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export function BaseButtonGroup({
  orientation = 'horizontal',
  size = 'md',
  className,
  children,
  ...props
}: BaseButtonGroupProps) {
  const orientationClasses = orientation === 'vertical' ? 'flex-col' : 'flex-row';
  const sizeClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  }[size];

  const classes = cn(
    'inline-flex',
    orientationClasses,
    sizeClasses,
    className
  );

  return (
    <div className={classes} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          // Remove rounded corners from middle buttons
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          let roundedClasses = '';
          if (orientation === 'horizontal') {
            roundedClasses = isFirst ? 'rounded-r-none' : isLast ? 'rounded-l-none' : 'rounded-none';
          } else {
            roundedClasses = isFirst ? 'rounded-b-none' : isLast ? 'rounded-t-none' : 'rounded-none';
          }
          
          return React.cloneElement(child, {
            className: cn(child.props.className, roundedClasses),
          });
        }
        return child;
      })}
    </div>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default BaseButton;
