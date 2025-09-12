'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Save, X } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseInput } from '@/components/ui/BaseInput';
import { BaseButton } from '@/components/ui/BaseButton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface SessionDuration {
  id: number;
  name: string;
  duration_minutes: number;
  description: string;
  isActive: boolean;
}

interface ScheduleTemplate {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  sessionDurationId: number;
  capacity: number;
  isAvailable: boolean;
  autoAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  sessionDuration: SessionDuration;
}

interface ScheduleTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  scheduleTemplate?: ScheduleTemplate | null;
  sessionDurations: SessionDuration[];
  mode: 'create' | 'edit';
}

const ScheduleTemplateModal: React.FC<ScheduleTemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  scheduleTemplate,
  sessionDurations,
  mode
}) => {
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    sessionDurationId: '',
    capacity: '',
    isAvailable: true,
    autoAvailable: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (scheduleTemplate && mode === 'edit') {
      setFormData({
        dayOfWeek: scheduleTemplate.dayOfWeek || '',
        startTime: scheduleTemplate.startTime || '',
        endTime: scheduleTemplate.endTime || '',
        sessionDurationId: (scheduleTemplate.sessionDurationId !== null && scheduleTemplate.sessionDurationId !== undefined)
          ? scheduleTemplate.sessionDurationId.toString()
          : '',
        capacity: (scheduleTemplate.capacity !== null && scheduleTemplate.capacity !== undefined)
          ? scheduleTemplate.capacity.toString()
          : '',
        isAvailable: scheduleTemplate.isAvailable ?? true,
        autoAvailable: scheduleTemplate.autoAvailable ?? false
      });
    } else {
      resetForm();
    }
  }, [scheduleTemplate, mode]);

  const resetForm = () => {
    setFormData({
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      sessionDurationId: '',
      capacity: '',
      isAvailable: true,
      autoAvailable: true
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.dayOfWeek) {
      newErrors.dayOfWeek = 'Day of week is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!formData.sessionDurationId) {
      newErrors.sessionDurationId = 'Session duration is required';
    }

    if (!formData.capacity) {
      newErrors.capacity = 'Capacity is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      
      if (start >= end) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        ...formData,
        capacity: parseInt(formData.capacity),
        sessionDurationId: parseInt(formData.sessionDurationId)
      });
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
      title={mode === 'create' ? 'Create Schedule Template' : 'Edit Schedule Template'}
      description="Configure schedule template settings"
      size="lg"
      variant="default"
    >
      <BaseModal.Header icon={<Calendar className="w-5 h-5 text-[var(--color-accent-500)]" />}>
        <h3 className="text-[var(--font-size-lg)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
          {mode === 'create' ? 'Create New Schedule Template' : 'Edit Schedule Template'}
        </h3>
      </BaseModal.Header>

      <BaseModal.Content>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Day of Week */}
          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">Day of Week</Label>
            <Select
              value={formData.dayOfWeek}
              onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
            >
              <SelectTrigger className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]">
                <SelectValue placeholder="Select day of week" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)]">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <SelectItem key={day} value={day} className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]">
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dayOfWeek && (
              <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                {errors.dayOfWeek}
              </p>
            )}
          </div>

          {/* Session Duration */}
          <div className="space-y-2">
            <Label htmlFor="sessionDurationId">Session Duration</Label>
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
                    {duration.name} ({duration.duration_minutes} min)
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

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <BaseInput
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
              {errors.startTime && (
                <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                  {errors.startTime}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <BaseInput
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
              {errors.endTime && (
                <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Max Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <BaseInput
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="Enter capacity"
              required
            />
            {errors.capacity && (
              <p className="text-[var(--color-status-error)] text-[var(--font-size-sm)]">
                {errors.capacity}
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isAvailable"
              checked={formData.isAvailable}
              onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
            />
            <Label htmlFor="isAvailable" className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Available
            </Label>
          </div>

          {/* Auto Available */}
          <div className="flex items-center space-x-2">
            <Switch
              id="autoAvailable"
              checked={formData.autoAvailable}
              onCheckedChange={(checked) => setFormData({ ...formData, autoAvailable: checked })}
            />
            <Label htmlFor="autoAvailable" className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
              Auto Available
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
            {mode === 'create' ? 'Create Template' : 'Update Template'}
          </BaseButton>
        </div>
      </BaseModal.Footer>
    </BaseModal>
  );
};

export default ScheduleTemplateModal;
