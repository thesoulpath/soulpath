/**
 * BaseModal Component
 * 
 * A centralized modal component that uses the design system
 * for consistent styling across the application.
 * 
 * Usage:
 * import { BaseModal } from '@/components/ui/BaseModal';
 * 
 * <BaseModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Modal Title"
 *   description="Modal description"
 *   size="lg"
 *   variant="default"
 * >
 *   <BaseModal.Content>Modal content goes here</BaseModal.Content>
 *   <BaseModal.Footer>
 *     <BaseButton onClick={onClose}>Cancel</BaseButton>
 *     <BaseButton variant="primary">Confirm</BaseButton>
 *   </BaseModal.Footer>
 * </BaseModal>
 */

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { BaseButton } from './BaseButton';
import { colors } from '@/lib/design-system';

// ============================================================================
// TYPES
// ============================================================================

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface BaseModalHeaderProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
}

export interface BaseModalContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface BaseModalFooterProps {
  children: React.ReactNode;
  className?: string;
  alignment?: 'left' | 'center' | 'right' | 'between';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  variant = 'default',
  children,
  className,

  closeOnOverlayClick = true,

}: BaseModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-[95vw]',
  };

  const variantClasses = {
    default: 'bg-gray-800 border-gray-600',
    danger: 'bg-gray-800 border-red-500',
    warning: 'bg-gray-800 border-yellow-500',
    success: 'bg-gray-800 border-green-500',
    info: 'bg-gray-800 border-blue-500',
  };

  const modalClasses = cn(
    'dashboard-modal',
    sizeClasses[size],
    variantClasses[variant],
    'rounded-lg',
    'shadow-xl',
    'border',
    className
  );

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={closeOnOverlayClick ? onClose : undefined}
    >
      <DialogContent className={modalClasses}>
        <DialogHeader>
          <DialogTitle className={cn(
            "dashboard-modal-title text-xl font-bold",
            title ? "text-white" : "sr-only" // sr-only hides the title visually but keeps it accessible
          )}>
            {title || "Modal"}
          </DialogTitle>
          {description && (
            <DialogDescription className="dashboard-modal-description text-gray-400 text-base">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {children}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

BaseModal.Header = function BaseModalHeader({
  children,
  className,
  icon,
  variant = 'default',
}: BaseModalHeaderProps) {
  const variantIconColors = {
    default: colors.text.primary,
    danger: colors.status.error,
    warning: colors.status.warning,
    success: colors.status.success,
    info: colors.status.info,
  };

  return (
    <div className={cn(`pb-4 border-b border-gray-600/20`, className)}>
      <div className="flex items-center gap-2">
        {icon && (
          <div className={`text-[${variantIconColors[variant]}]`}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

BaseModal.Content = function BaseModalContent({
  children,
  className,
  padding = 'md',
}: BaseModalContentProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={cn(paddingClasses[padding], className)}>
      {children}
    </div>
  );
};

BaseModal.Footer = function BaseModalFooter({
  children,
  className,
  alignment = 'right',
}: BaseModalFooterProps) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 pt-4 border-t border-gray-600/20',
      alignmentClasses[alignment],
      className
    )}>
      {children}
    </div>
  );
};

// ============================================================================
// SPECIALIZED MODAL COMPONENTS
// ============================================================================

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  children?: React.ReactNode;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  isLoading = false,
  children,
}: ConfirmationModalProps) {
  const variantConfig = {
    danger: {
      icon: icon || <AlertTriangle className="w-5 h-5" />,
      confirmVariant: 'danger' as const,
      borderColor: colors.status.error,
    },
    warning: {
      icon: icon || <AlertTriangle className="w-5 h-5" />,
      confirmVariant: 'warning' as const,
      borderColor: colors.status.warning,
    },
    success: {
      icon: icon || <CheckCircle className="w-5 h-5" />,
      confirmVariant: 'success' as const,
      borderColor: colors.status.success,
    },
    info: {
      icon: icon || <Info className="w-5 h-5" />,
      confirmVariant: 'info' as const,
      borderColor: colors.status.info,
    },
  };

  const config = variantConfig[variant];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      variant={variant}
    >
      <BaseModal.Content>
        {children && (
          <div className="mb-4 p-3 bg-gray-600/10 border border-gray-600/30 rounded-md">
            {children}
          </div>
        )}
      </BaseModal.Content>
      
      <BaseModal.Footer>
        <BaseButton
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </BaseButton>
        <BaseButton
          variant={config.confirmVariant}
          onClick={onConfirm}
          loading={isLoading}
        >
          {confirmText}
        </BaseButton>
      </BaseModal.Footer>
    </BaseModal>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

export function ModalSection({
  children,
  className,
  title,
  icon,
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'success' | 'error';
}) {
  const variantClasses = {
    default: `bg-[${colors.semantic.surface.secondary}] border-[${colors.border[500]}]`,
    info: `bg-[${colors.status.info}]/10 border-[${colors.status.info}]/30`,
    warning: `bg-[${colors.status.warning}]/10 border-[${colors.status.warning}]/30`,
    success: `bg-[${colors.status.success}]/10 border-[${colors.status.success}]/30`,
    error: `bg-[${colors.status.error}]/10 border-[${colors.status.error}]/30`,
  };

  return (
    <div className={cn(
      'p-4 rounded-md border',
      variantClasses[variant],
      className
    )}>
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {icon && <div className="text-gray-400">{icon}</div>}
          <h4 className="text-base font-medium text-white">
            {title}
          </h4>
        </div>
      )}
      {children}
    </div>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default BaseModal;
