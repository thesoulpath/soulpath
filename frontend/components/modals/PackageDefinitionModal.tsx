'use client';

import React, { useState, useEffect } from 'react';
import { Package, Users, Clock, Save, X } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseInput } from '@/components/ui/BaseInput';
import { BaseButton } from '@/components/ui/BaseButton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface SessionDuration {
  id: number;
  name: string;
  duration_minutes: number;
  description: string;
  isActive: boolean;
}

interface PackageDefinition {
  id: number;
  name: string;
  description: string;
  sessionsCount: number;
  sessionDurationId: number;
  packageType: 'individual' | 'group' | 'mixed';
  maxGroupSize: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sessionDuration: SessionDuration;
}

interface PackageDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  packageDefinition?: PackageDefinition | null;
  sessionDurations: SessionDuration[];
  mode: 'create' | 'edit';
}

const PackageDefinitionModal: React.FC<PackageDefinitionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  packageDefinition,
  sessionDurations,
  mode
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sessionsCount: '',
    sessionDurationId: '',
    packageType: 'individual' as 'individual' | 'group' | 'mixed',
    maxGroupSize: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (packageDefinition && mode === 'edit') {
      setFormData({
        name: packageDefinition.name,
        description: packageDefinition.description || '',
        sessionsCount: packageDefinition.sessionsCount.toString(),
        sessionDurationId: packageDefinition.sessionDurationId.toString(),
        packageType: packageDefinition.packageType,
        maxGroupSize: packageDefinition.maxGroupSize?.toString() || '',
        isActive: packageDefinition.isActive
      });
    } else {
      resetForm();
    }
  }, [packageDefinition, mode]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sessionsCount: '',
      sessionDurationId: '',
      packageType: 'individual',
      maxGroupSize: '',
      isActive: true
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Package name is required';
    }

    if (!formData.sessionsCount || parseInt(formData.sessionsCount) <= 0) {
      newErrors.sessionsCount = 'Sessions count must be a positive number';
    }

    if (!formData.sessionDurationId) {
      newErrors.sessionDurationId = 'Session duration is required';
    }

    if (formData.packageType === 'group' && (!formData.maxGroupSize || parseInt(formData.maxGroupSize) <= 1)) {
      newErrors.maxGroupSize = 'Group size must be greater than 1 for group packages';
    }

    if (formData.packageType === 'mixed' && (!formData.maxGroupSize || parseInt(formData.maxGroupSize) <= 1)) {
      newErrors.maxGroupSize = 'Group size must be greater than 1 for mixed packages';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const submitData = {
        ...formData,
        sessionsCount: parseInt(formData.sessionsCount),
        sessionDurationId: parseInt(formData.sessionDurationId),
        maxGroupSize: formData.maxGroupSize ? parseInt(formData.maxGroupSize) : null
      };
      
      onSubmit(submitData);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create Package Definition' : 'Edit Package Definition'}
      description="Define package settings and configuration"
      size="lg"
      variant="default"
    >
      <BaseModal.Header icon={<Package className="w-5 h-5 text-[var(--color-accent-500)]" />}>
        <h3 className="text-[var(--font-size-lg)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
          {mode === 'create' ? 'Create New Package Definition' : 'Edit Package Definition'}
        </h3>
      </BaseModal.Header>

      <BaseModal.Content>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Package Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Package Name</Label>
            <BaseInput
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter package name"
              required
            />
            {errors.name && (
              <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                {errors.name}
              </p>
            )}
          </div>

          {/* Package Type */}
          <div className="space-y-2">
            <Label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Package Type
            </Label>
            <Select
              value={formData.packageType}
              onValueChange={(value: 'individual' | 'group' | 'mixed') => 
                setFormData({ ...formData, packageType: value })
              }
            >
              <SelectTrigger className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]">
                <SelectValue placeholder="Select package type" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)]">
                <SelectItem value="individual" className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Individual Sessions
                  </div>
                </SelectItem>
                <SelectItem value="group" className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Group Sessions
                  </div>
                </SelectItem>
                <SelectItem value="mixed" className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Mixed (Individual + Group)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Group Size (conditional) */}
          {(formData.packageType === 'group' || formData.packageType === 'mixed') && (
            <div className="space-y-2">
              <Label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
                Maximum Group Size
              </Label>
              <BaseInput
                type="number"
                min="2"
                value={formData.maxGroupSize}
                onChange={(e) => setFormData({ ...formData, maxGroupSize: e.target.value })}
                placeholder="Enter maximum group size"
                required
              />
              {errors.maxGroupSize && (
                <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                  {errors.maxGroupSize}
                </p>
              )}
            </div>
          )}

          {/* Session Duration */}
          <div className="space-y-2">
            <Label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Session Duration
            </Label>
            <Select
              value={formData.sessionDurationId}
              onValueChange={(value) => setFormData({ ...formData, sessionDurationId: value })}
            >
              <SelectTrigger className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]">
                <SelectValue placeholder="Select session duration" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)]">
                {sessionDurations.map((duration) => (
                  <SelectItem key={duration.id} value={duration.id.toString()} className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {duration.name} ({duration.duration_minutes} min)
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sessionDurationId && (
              <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                {errors.sessionDurationId}
              </p>
            )}
          </div>

          {/* Sessions Count */}
          <div className="space-y-2">
            <Label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Number of Sessions
            </Label>
            <BaseInput
              type="number"
              min="1"
              value={formData.sessionsCount}
              onChange={(e) => setFormData({ ...formData, sessionsCount: e.target.value })}
              placeholder="Enter number of sessions"
              required
            />
            {errors.sessionsCount && (
              <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                {errors.sessionsCount}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter package description (optional)"
              className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive" className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Active Package
            </Label>
          </div>
        </form>
      </BaseModal.Content>

      <BaseModal.Footer>
        <div className="flex justify-end space-x-3">
          <BaseButton
            variant="outline"
            onClick={handleClose}
            leftIcon={<X className="w-4 h-4" />}
          >
            Cancel
          </BaseButton>
          
          <BaseButton
            variant="primary"
            onClick={handleSubmit}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {mode === 'create' ? 'Create Package' : 'Update Package'}
          </BaseButton>
        </div>
      </BaseModal.Footer>
    </BaseModal>
  );
};

export default PackageDefinitionModal;
