/**
 * BaseCard Component
 * 
 * A centralized card component that uses the design system
 * for consistent styling across the application.
 * 
 * Usage:
 * import { BaseCard } from '@/components/ui/BaseCard';
 * 
 * <BaseCard variant="elevated" size="lg">
 *   <BaseCard.Header>Card Title</BaseCard.Header>
 *   <BaseCard.Content>Card content goes here</BaseCard.Content>
 *   <BaseCard.Footer>Card footer</BaseCard.Footer>
 * </BaseCard>
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { cardStyles, combineStyles } from '@/lib/styles/common';

// ============================================================================
// TYPES
// ============================================================================

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  focus?: boolean;
  active?: boolean;
  children: React.ReactNode;
}

export interface BaseCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface BaseCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface BaseCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BaseCard({
  variant = 'default',
  size = 'md',
  hover = false,
  focus = false,
  active = false,
  className,
  children,
  ...props
}: BaseCardProps) {
  const baseClasses = cardStyles.base;
  const variantClasses = cardStyles.variants[variant];
  const sizeClasses = cardStyles.sizes[size];
  
  const stateClasses = combineStyles(
    hover && cardStyles.states.hover,
    focus && cardStyles.states.focus,
    active && cardStyles.states.active
  );

  const classes = combineStyles(
    baseClasses,
    variantClasses,
    sizeClasses,
    stateClasses,
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

BaseCard.Header = function BaseCardHeader({
  className,
  children,
  ...props
}: BaseCardHeaderProps) {
  return (
    <div
      className={cn(
        'border-b border-border/20 pb-4 mb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

BaseCard.Content = function BaseCardContent({
  className,
  children,
  ...props
}: BaseCardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
};

BaseCard.Footer = function BaseCardFooter({
  className,
  children,
  ...props
}: BaseCardFooterProps) {
  return (
    <div
      className={cn(
        'border-t border-border/20 pt-4 mt-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default BaseCard;
