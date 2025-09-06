'use client';

import React from 'react';
import { Package, DollarSign, Calendar } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/BaseModal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  itemType: 'definition' | 'price' | 'template' | 'slot' | 'booking';
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType,
  isLoading = false
}) => {
  const getIcon = () => {
    switch (itemType) {
      case 'definition':
        return <Package className="w-5 h-5" />;
      case 'price':
        return <DollarSign className="w-5 h-5" />;
      case 'template':
      case 'slot':
        return <Calendar className="w-5 h-5" />;
      case 'booking':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getItemTypeText = () => {
    switch (itemType) {
      case 'definition':
        return 'package definition';
      case 'price':
        return 'package price';
      case 'template':
        return 'schedule template';
      case 'slot':
        return 'schedule slot';
      case 'booking':
        return 'booking';
      default:
        return 'item';
    }
  };

  const getWarningMessage = () => {
    const baseMessage = `Deleting this ${getItemTypeText()} will permanently remove it from the system.`;
    
    switch (itemType) {
      case 'definition':
        return `${baseMessage} All associated prices will also be deleted.`;
      case 'price':
        return `${baseMessage} This may affect existing user packages.`;
      case 'template':
        return `${baseMessage} All associated schedule slots will also be deleted.`;
      case 'slot':
        return `${baseMessage} This may affect existing bookings.`;
      case 'booking':
        return `${baseMessage} This will restore the session to the user package.`;
      default:
        return baseMessage;
    }
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText={isLoading ? 'Deleting...' : 'Delete'}
      cancelText="Cancel"
      variant="danger"
      icon={getIcon()}
      isLoading={isLoading}
    >
      <div className="space-y-2">
        {itemName && (
          <p className="font-medium">
            &ldquo;{itemName}&rdquo;
          </p>
        )}
        <p className="text-sm">
          {getWarningMessage()}
        </p>
        <p className="text-sm font-medium">
          This action cannot be undone.
        </p>
      </div>
    </ConfirmationModal>
  );
};

export default DeleteConfirmationModal;
