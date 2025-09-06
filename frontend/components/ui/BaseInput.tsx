/**
 * BaseInput Component
 * 
 * A centralized input component that uses the design system
 * for consistent styling across the application.
 * 
 * Usage:
 * import { BaseInput } from '@/components/ui/BaseInput';
 * 
 * <BaseInput 
 *   variant="default" 
 *   size="md" 
 *   placeholder="Enter text..."
 *   leftIcon={<SearchIcon />}
 *   rightIcon={<ClearIcon />}
 * />
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { inputStyles, combineStyles } from '@/lib/styles/common';

// ============================================================================
// TYPES
// ============================================================================

export interface BaseInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(({
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  label,
  error,
  hint,
  required = false,
  className,
  id,
  ...props
}, ref) => {
  const baseClasses = inputStyles.base;
  const variantClasses = inputStyles.variants[variant];
  const sizeClasses = inputStyles.sizes[size];
  
  // Add padding for icons
  const iconPadding = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';
  
  const classes = combineStyles(
    baseClasses,
    variantClasses,
    sizeClasses,
    iconPadding,
    className
  );

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-400 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={classes}
          aria-invalid={variant === 'error'}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="h-5 w-5">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p 
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {hint && !error && (
        <p 
          id={`${inputId}-hint`}
          className="mt-1 text-sm text-gray-400"
        >
          {hint}
        </p>
      )}
    </div>
  );
});

BaseInput.displayName = 'BaseInput';

// ============================================================================
// INPUT GROUP COMPONENT
// ============================================================================

export interface BaseInputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function BaseInputGroup({
  size = 'md',
  className,
  children,
  ...props
}: BaseInputGroupProps) {
  const sizeClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  }[size];

  const classes = cn(
    'flex',
    sizeClasses,
    className
  );

  return (
    <div className={classes} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          // Remove rounded corners from middle inputs
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          let roundedClasses = '';
          if (isFirst) {
            roundedClasses = 'rounded-r-none';
          } else if (isLast) {
            roundedClasses = 'rounded-l-none';
          } else {
            roundedClasses = 'rounded-none';
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

export default BaseInput;
