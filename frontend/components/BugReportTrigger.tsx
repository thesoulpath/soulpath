'use client';

import React from 'react';
import { Bug } from 'lucide-react';
import { BaseButton } from '@/components/ui/BaseButton';
import { BugReportSystem } from './BugReportSystem';

interface BugReportTriggerProps {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function BugReportTrigger({ 
  variant = 'outline', 
  size = 'md', 
  className = '',
  children 
}: BugReportTriggerProps) {
  return (
    <BugReportSystem>
      {({ openReport }) => (
        <BaseButton
          onClick={openReport}
          variant={variant}
          size={size}
          leftIcon={<Bug size={16} />}
          className={className}
        >
          {children || 'Report Bug'}
        </BaseButton>
      )}
    </BugReportSystem>
  );
}
