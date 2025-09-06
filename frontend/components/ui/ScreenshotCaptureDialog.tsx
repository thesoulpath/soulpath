/**
 * ScreenshotCaptureDialog Component
 * 
 * A specialized dialog for screenshot capture that follows the centralized design system.
 * 
 * Usage:
 * import { ScreenshotCaptureDialog } from '@/components/ui/ScreenshotCaptureDialog';
 * 
 * <ScreenshotCaptureDialog
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   onCapture={handleCapture}
 * />
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Camera, Monitor, MonitorSmartphone, AlertTriangle } from 'lucide-react';
import { BaseButton } from './BaseButton';
import { createPortal } from 'react-dom';

// ============================================================================
// TYPES
// ============================================================================

export interface ScreenshotCaptureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (stream: MediaStream) => void;
  title?: string;
  description?: string;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScreenshotCaptureDialog({
  isOpen,
  onClose,
  onCapture,
  title = "Capture Screenshot",
  description = "Select what you want to capture for your bug report",
  className,
}: ScreenshotCaptureDialogProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (mediaSource: 'screen' | 'window' | 'tab') => {
    try {
      setIsCapturing(true);
      setError(null);

      const stream = await navigator.mediaDevices.getDisplayMedia({
        // preferCurrentTab: true, // Not supported in all browsers
        video: { 
          // mediaSource, // Unused for now
          displaySurface: mediaSource === 'screen' ? 'monitor' : 'window'
        }
      });

      onCapture(stream);
      onClose();
    } catch (error) {
      console.error('Screenshot capture error:', error);
      setError('Failed to capture screenshot. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const captureOptions = [
    {
      id: 'screen',
      title: 'Entire Screen',
      description: 'Capture your full desktop screen',
      icon: Monitor,
      mediaSource: 'screen' as const,
    },
    {
      id: 'window',
      title: 'Application Window',
      description: 'Capture a specific application window',
      icon: MonitorSmartphone,
      mediaSource: 'window' as const,
    },
    {
      id: 'tab',
      title: 'Browser Tab',
      description: 'Capture the current browser tab',
      icon: Camera,
      mediaSource: 'tab' as const,
    },
  ];

  const dialogClasses = cn(
    'screenshot-capture-dialog',
    'bg-gray-800 border border-gray-600',
    'rounded-lg shadow-xl',
    'max-w-md w-full mx-auto',
    className
  );

  const dialogContent = (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogClasses} style={{ maxWidth: '500px' }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center space-x-2">
            <Camera size={20} className="text-purple-400" />
            <span>{title}</span>
          </DialogTitle>
          {description && (
            <p className="text-gray-400 text-sm mt-2">
              {description}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2">
              <AlertTriangle size={16} className="text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Capture Options */}
          <div className="space-y-3">
            {captureOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleCapture(option.mediaSource)}
                  disabled={isCapturing}
                  className={cn(
                    'w-full p-4 text-left',
                    'bg-gray-700 hover:bg-gray-600',
                    'border border-gray-600 hover:border-purple-500',
                    'rounded-lg transition-all duration-200',
                    'flex items-start space-x-3',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800'
                  )}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Icon size={20} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{option.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Tip:</strong> Choose the option that best shows the issue you&apos;re reporting. 
              The modal will be hidden during capture.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-600">
          <BaseButton
            onClick={onClose}
            variant="outline"
            size="sm"
            disabled={isCapturing}
          >
            Cancel
          </BaseButton>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Use portal to ensure proper rendering
  if (typeof window !== 'undefined') {
    return createPortal(dialogContent, document.body);
  }

  return dialogContent;
}

// ============================================================================
// EXPORT
// ============================================================================

export default ScreenshotCaptureDialog;
