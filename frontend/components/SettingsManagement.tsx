'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Download, 
  CheckCircle, 
  XCircle, 
} from 'lucide-react';
import { BaseCard } from '@/components/ui/BaseCard';
import { BaseButton } from '@/components/ui/BaseButton';
import { useAuth } from '../hooks/useAuth';

export function SettingsManagement() {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [seedMessage, setSeedMessage] = useState('');
  const [isSeedingCustomers, setIsSeedingCustomers] = useState(false);
  const [seedCustomersStatus, setSeedCustomersStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [seedCustomersMessage, setSeedCustomersMessage] = useState('');
  const [isSeedingSchedules, setIsSeedingSchedules] = useState(false);
  const [seedSchedulesStatus, setSeedSchedulesStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [seedSchedulesMessage, setSeedSchedulesMessage] = useState('');

  const handleSeedContent = async () => {
    if (!confirm('Are you sure you want to seed the homepage content? This will overwrite existing content.')) {
      return;
    }

    if (!user?.access_token) {
      setSeedStatus('error');
      setSeedMessage('Authentication required. Please log in again.');
      return;
    }

    setIsSeeding(true);
    setSeedStatus('idle');
    setSeedMessage('');

    try {
      const response = await fetch('/api/admin/content/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
      });

      if (response.ok) {
        await response.json();
        setSeedStatus('success');
        setSeedMessage('Homepage content seeded successfully!');
      } else {
        const error = await response.json();
        setSeedStatus('error');
        setSeedMessage(error.message || 'Failed to seed content');
      }
    } catch {
      setSeedStatus('error');
      setSeedMessage('Network error occurred while seeding content');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSeedCustomers = async (clearExisting = false) => {
    const message = clearExisting 
      ? 'Are you sure you want to clear existing sample customers and seed 3 new ones? This will overwrite any existing sample customers.'
      : 'Are you sure you want to seed 3 sample customers? This will create new customer records (existing ones will be skipped).';
      
    if (!confirm(message)) {
      return;
    }

    if (!user?.access_token) {
      setSeedCustomersStatus('error');
      setSeedCustomersMessage('Authentication required. Please log in again.');
      return;
    }

    setIsSeedingCustomers(true);
    setSeedCustomersStatus('idle');
    setSeedCustomersMessage('');

    try {
      const url = clearExisting 
        ? '/api/admin/seed/users?clear=true'
        : '/api/admin/seed/users';
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
      });

      if (response.ok) {
        await response.json();
        setSeedCustomersStatus('success');
        setSeedCustomersMessage(clearExisting 
          ? 'Sample customers cleared and reseeded successfully!' 
          : 'Sample customers seeded successfully!'
        );
      } else {
        const error = await response.json();
        setSeedCustomersStatus('error');
        setSeedCustomersMessage(error.message || 'Failed to seed customers');
      }
    } catch {
      setSeedCustomersStatus('error');
      setSeedCustomersMessage('Network error occurred while seeding customers');
    } finally {
      setIsSeedingCustomers(false);
    }
  };

  const handleSeedSchedules = async () => {
    if (!confirm('Are you sure you want to seed sample schedules? This will create new schedule templates.')) {
      return;
    }

    if (!user?.access_token) {
      setSeedSchedulesStatus('error');
      setSeedSchedulesMessage('Authentication required. Please log in again.');
      return;
    }

    setIsSeedingSchedules(true);
    setSeedSchedulesStatus('idle');
    setSeedSchedulesMessage('');

    try {
      const response = await fetch('/api/admin/seed/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
      });

      if (response.ok) {
        await response.json();
        setSeedSchedulesStatus('success');
        setSeedSchedulesMessage('Sample schedules seeded successfully!');
      } else {
        const error = await response.json();
        setSeedSchedulesStatus('error');
        setSeedSchedulesMessage(error.message || 'Failed to seed schedules');
      }
    } catch {
      setSeedSchedulesStatus('error');
      setSeedSchedulesMessage('Network error occurred while seeding schedules');
    } finally {
      setIsSeedingSchedules(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Settings & Configuration</h2>
      </div>

      {/* Content Seeding Section */}
      <BaseCard variant="default" size="lg">
        <BaseCard.Header>
          <h3 className="text-xl font-semibold text-white">Content Management</h3>
        </BaseCard.Header>
        <BaseCard.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-white">Seed Homepage Content</h4>
                <p className="text-gray-400">Populate the homepage with sample content and sections</p>
              </div>
              <BaseButton
                variant="primary"
                onClick={handleSeedContent}
                loading={isSeeding}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Seed Content
              </BaseButton>
            </div>

            {seedStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center space-x-2 px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--border-radius-lg)] ${
                  seedStatus === 'success' 
                    ? `bg-[var(--color-status-success)]/20 text-[var(--color-status-success)] border border-[var(--color-status-success)]/30`
                    : `bg-[var(--color-status-error)]/20 text-[var(--color-status-error)] border border-[var(--color-status-error)]/30`
                }`}
              >
                {seedStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="text-[var(--font-size-sm)]">{seedMessage}</span>
              </motion.div>
            )}
          </div>
        </BaseCard.Content>
      </BaseCard>

      {/* Customer Seeding Section */}
      <BaseCard variant="default" size="lg">
        <BaseCard.Header>
          <h3 className="text-xl font-semibold text-white">Customer Management</h3>
        </BaseCard.Header>
        <BaseCard.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-white">Seed Sample Customers</h4>
                <p className="text-gray-400">Create sample customer records for testing</p>
              </div>
              <div className="flex space-x-2">
                <BaseButton
                  variant="outline"
                  onClick={() => handleSeedCustomers(false)}
                  loading={isSeedingCustomers}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Add Customers
                </BaseButton>
                <BaseButton
                  variant="outline"
                  onClick={() => handleSeedCustomers(true)}
                  loading={isSeedingCustomers}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Replace All
                </BaseButton>
              </div>
            </div>

            {seedCustomersStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center space-x-2 px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--border-radius-lg)] ${
                  seedCustomersStatus === 'success' 
                    ? `bg-[var(--color-status-success)]/20 text-[var(--color-status-success)] border border-[var(--color-status-success)]/30`
                    : `bg-[var(--color-status-error)]/20 text-[var(--color-status-error)] border border-[var(--color-status-error)]/30`
                }`}
              >
                {seedCustomersStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="text-[var(--font-size-sm)]">{seedCustomersMessage}</span>
              </motion.div>
            )}
          </div>
        </BaseCard.Content>
      </BaseCard>

      {/* Schedule Seeding Section */}
      <BaseCard variant="default" size="lg">
        <BaseCard.Header>
          <h3 className="text-xl font-semibold text-white">Schedule Management</h3>
        </BaseCard.Header>
        <BaseCard.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-white">Seed Sample Schedules</h4>
                <p className="text-gray-400">Create sample schedule templates for testing</p>
              </div>
              <BaseButton
                variant="outline"
                onClick={handleSeedSchedules}
                loading={isSeedingSchedules}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Seed Schedules
              </BaseButton>
            </div>

            {seedSchedulesStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center space-x-2 px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--border-radius-lg)] ${
                  seedSchedulesStatus === 'success' 
                    ? `bg-[var(--color-status-success)]/20 text-[var(--color-status-success)] border border-[var(--color-status-success)]/30`
                    : `bg-[var(--color-status-error)]/20 text-[var(--color-status-error)] border border-[var(--color-status-error)]/30`
                }`}
              >
                {seedSchedulesStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="text-[var(--font-size-sm)]">{seedSchedulesMessage}</span>
              </motion.div>
            )}
          </div>
        </BaseCard.Content>
      </BaseCard>

      {/* System Status Section */}
      <BaseCard variant="default" size="lg">
        <BaseCard.Header>
          <h3 className="text-xl font-semibold text-white">System Status</h3>
        </BaseCard.Header>
        <BaseCard.Content>
          <div className="space-y-6">
            {/* Database Status */}
            <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <h4 className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-white mb-[var(--spacing-2)]">
                    Database Connection
                  </h4>
                  <p className="text-white">Connected</p>
                </div>
              </div>
            </div>

            {/* API Status */}
            <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <h4 className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-white mb-[var(--spacing-2)]">
                    API Service
                  </h4>
                  <p className="text-white">Operational</p>
                </div>
              </div>
            </div>

            {/* Version Info */}
            <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-white mb-[var(--spacing-2)]">
                    Application Version
                  </h4>
                  <p className="text-white">v1.0.0</p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-white mb-[var(--spacing-2)]">
                    Last Updated
                  </h4>
                  <p className="text-white">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </BaseCard.Content>
      </BaseCard>
    </div>
  );
}
