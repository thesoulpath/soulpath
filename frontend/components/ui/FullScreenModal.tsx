/**
 * FullScreenModal Component
 * 
 * A specialized modal component for full-screen desktop-style modals
 * that follows the centralized design system.
 * 
 * Usage:
 * import { FullScreenModal } from '@/components/ui/FullScreenModal';
 * 
 * <FullScreenModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Full Screen Modal"
 * >
 *   <div>Modal content goes here</div>
 * </FullScreenModal>
 */

import React, { useEffect } from 'react';
// import { Dialog, DialogContent } from '@/components/ui/dialog'; // Unused for now
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { BaseButton } from './BaseButton';

// ============================================================================
// TYPES
// ============================================================================

export interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FullScreenModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
  // closeOnOverlayClick = false, // Unused for now
  closeOnEscape = true,
  headerContent,
  footerContent,
}: FullScreenModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  const modalClasses = cn(
    'fullscreen-modal',
    'fixed inset-0 z-50',
    'bg-gray-900/95 backdrop-blur-sm',
    'flex flex-col',
    className
  );

  const contentClasses = cn(
    'fullscreen-modal-content',
    'flex-1 flex flex-col',
    'bg-gray-800',
    'border border-gray-600',
    'shadow-2xl',
    'overflow-hidden'
  );

  if (!isOpen) return null;

  return (
    <div className={modalClasses}>
      <div className={contentClasses}>
        {/* Header */}
        {(title || headerContent || showCloseButton) && (
          <div className="fullscreen-modal-header flex items-center justify-between p-6 border-b border-gray-600 bg-gray-800">
            <div className="flex items-center space-x-4">
              {title && (
                <h2 className="text-2xl font-bold text-white">
                  {title}
                </h2>
              )}
              {headerContent && (
                <div className="flex-1">
                  {headerContent}
                </div>
              )}
            </div>
            
            {showCloseButton && (
              <BaseButton
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <X size={20} />
              </BaseButton>
            )}
          </div>
        )}

        {/* Content */}
        <div className="fullscreen-modal-body flex-1 overflow-hidden">
          {children}
        </div>

        {/* Footer */}
        {footerContent && (
          <div className="fullscreen-modal-footer p-6 border-t border-gray-600 bg-gray-800">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

FullScreenModal.Header = function FullScreenModalHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('p-6 border-b border-gray-600 bg-gray-800', className)}>
      {children}
    </div>
  );
};

FullScreenModal.Content = function FullScreenModalContent({
  children,
  className,
  padding = 'lg',
}: {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  return (
    <div className={cn('flex-1 overflow-auto', paddingClasses[padding], className)}>
      {children}
    </div>
  );
};

FullScreenModal.Footer = function FullScreenModalFooter({
  children,
  className,
  alignment = 'right',
}: {
  children: React.ReactNode;
  className?: string;
  alignment?: 'left' | 'center' | 'right' | 'between';
}) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={cn(
      'p-6 border-t border-gray-600 bg-gray-800',
      'flex items-center gap-3',
      alignmentClasses[alignment],
      className
    )}>
      {children}
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default FullScreenModal;
