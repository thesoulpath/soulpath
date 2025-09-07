import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  LogOut,
  Users,
  Calendar,
  Clock,
  Package,
  FileText,
  Mail,
  ImageIcon,
  // Type,
  Search,
  CreditCard,
  Receipt,
  History,
  Database,
  Bug,
  User,
  Star,
  Video,
  Zap,
  Brain,
  MessageSquare
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { sidebarButtonStyles, combineStyles } from '@/lib/styles/common';
import { ClientManagement } from './ClientManagement';
import BookingsManagement from './BookingsManagement';
import ScheduleManagement from './ScheduleManagement';
import PackagesAndPricing from './PackagesAndPricing';
import { ContentManagement } from './ContentManagement';
import { CommunicationSettings } from './communication/CommunicationSettings';
import { ImageManagement } from './ImageManagement';
// import { LogoManagement } from './LogoManagement';
import { SeoManagement } from './SeoManagement';
import PaymentMethodManagement from './PaymentMethodManagement';
import PaymentRecordsManagement from './PaymentRecordsManagement';
import PurchaseHistoryManagement from './PurchaseHistoryManagement';
import { SettingsManagement } from './SettingsManagement';
import { BugReportManagement, BugReportManagementRef } from './BugReportManagement';
import { BugReportSystem } from './BugReportSystem';

import { AstrologyManagement } from './AstrologyManagement';
import { LiveSessionConfigManagement } from './LiveSessionConfigManagement';
import { ExternalAPIManagement } from './ExternalAPIManagement';
import { RasaMonitoring } from './RasaMonitoring';
import { RasaModelTuning } from './RasaModelTuning';
import ConversationLogsManagement from './admin/ConversationLogsManagement';
import Link from 'next/link';

interface AdminDashboardProps {
  onClose?: () => void;
  isModal?: boolean;
  children?: React.ReactNode;
}

export function AdminDashboard({ onClose, isModal = true, children }: AdminDashboardProps) {
  const { user, signOut, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('clients');
  const bugReportManagementRef = useRef<BugReportManagementRef>(null);

  // Callback function to refresh bug reports when a new one is submitted
  const handleBugReportSubmitSuccess = () => {
    if (activeTab === 'bug-reports' && bugReportManagementRef.current) {
      bugReportManagementRef.current.refreshBugReports();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  const containerClasses = isModal 
    ? "fixed inset-0 bg-[var(--color-background-primary)] z-50 overflow-hidden"
    : "min-h-screen bg-[var(--color-background-primary)]";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <header className="bg-[var(--color-sidebar-800)] border-b border-[var(--color-border-500)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[var(--color-accent-500)] rounded-full flex items-center justify-center">
              <Settings size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">
                Admin Dashboard
              </h1>
              <p className="text-[var(--color-text-secondary)]">Welcome back, {user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Report Bug Button */}
            <BugReportSystem onSubmitSuccess={handleBugReportSubmitSuccess}>
              {({ openReport }) => (
                <button
                  onClick={openReport}
                  className="inline-flex items-center justify-center font-[var(--font-weight-medium)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:ring-offset-[var(--color-background-primary)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 bg-purple-600 text-white hover:bg-purple-700 border border-purple-500 rounded-[var(--border-radius-md)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-sm)]"
                >
                  <Bug size={16} className="mr-2 text-white" />
                  Report Bug
                </button>
              )}
            </BugReportSystem>

            {/* Close button - only show in modal mode */}
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center font-[var(--font-weight-medium)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-600)] focus:ring-offset-2 focus:ring-offset-[var(--color-background-primary)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 bg-[var(--color-secondary-800)] text-white hover:bg-[var(--color-secondary-700)] border border-[var(--color-secondary-600)] rounded-[var(--border-radius-md)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-sm)]"
              >
                <X size={16} className="mr-2 text-white" />
                Close
              </button>
            )}
            
            {/* Admin Account Button - Only show for admin users */}
            {isAdmin && (
              <Link href="/account">
                <button
                  className="inline-flex items-center justify-center font-[var(--font-weight-medium)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 focus:ring-offset-[var(--color-background-primary)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 bg-[var(--color-primary-500)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-500)]/90 active:bg-[var(--color-primary-500)]/80 border-2 border-[var(--color-primary-500)] rounded-[var(--border-radius-md)] shadow-lg shadow-[var(--color-primary-500)]/30 font-[var(--font-weight-semibold)] hover:shadow-xl hover:shadow-[var(--color-primary-500)]/40 focus:ring-4 focus:ring-[var(--color-primary-500)]/30 focus:border-[var(--color-primary-500)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-sm)]"
                >
                  <User size={16} className="mr-2" />
                  My Account
                </button>
              </Link>
            )}
            
            <button
              onClick={signOut}
              className="inline-flex items-center justify-center font-[var(--font-weight-medium)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-status-error)] focus:ring-offset-2 focus:ring-offset-[var(--color-background-primary)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 bg-[var(--color-status-error)] text-white hover:bg-red-600 border-none rounded-[var(--border-radius-md)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-[var(--font-size-sm)]"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar Navigation */}
        <nav className="w-56 bg-[var(--color-sidebar-800)] border-r border-[var(--color-border-500)] p-3 overflow-y-auto">e
          
          <div className="space-y-1">
            {[
              { key: 'astrology', icon: Star, label: 'Astrology Charts' },
              { key: 'rasa-monitoring', icon: Brain, label: 'Rasa AI Monitoring' },
              { key: 'rasa-tuning', icon: Settings, label: 'Model Tuning' },
              { key: 'conversation-logs', icon: MessageSquare, label: 'Conversation Logs' },
              { key: 'clients', icon: Users, label: 'Client Management' },
              { key: 'bookings', icon: Calendar, label: 'Bookings Management' },
              { key: 'schedules', icon: Clock, label: 'Schedule Management' },
              { key: 'packages', icon: Package, label: 'Packages & Pricing' },
              { key: 'content', icon: FileText, label: 'Content Management' },
              { key: 'email', icon: Mail, label: 'Communication Settings' },
              { key: 'live-session', icon: Video, label: 'Live Session Config' },
              { key: 'images', icon: ImageIcon, label: 'Image Management' },
              { key: 'external-apis', icon: Zap, label: 'External APIs' },
              // { key: 'logo', icon: Type, label: 'Logo Management' },
              { key: 'seo', icon: Search, label: 'SEO Management' },
              { key: 'payment-methods', icon: CreditCard, label: 'Payment Methods' },
              { key: 'payment-records', icon: Receipt, label: 'Payment Records' },
              { key: 'purchase-history', icon: History, label: 'Purchase History' },
              { key: 'settings', icon: Database, label: 'Settings' },
              { key: 'bug-reports', icon: Bug, label: 'Bug Reports' },
            ].map(({ key, icon: Icon, label }) => {
              // Special styling for astrology button
              const isAstrology = key === 'astrology';
              const isActive = activeTab === key;
              
              const buttonClasses = isAstrology 
                ? `w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-purple-600 text-white hover:bg-orange-500'
                  }`
                : combineStyles(
                    sidebarButtonStyles.base,
                    isActive ? sidebarButtonStyles.variants.active : sidebarButtonStyles.variants.inactive
                  );
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={buttonClasses}
                >
                  <Icon size={18} className={sidebarButtonStyles.icon} />
                  <span className={sidebarButtonStyles.label}>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[var(--color-background-primary)]">
          <div className="p-6">
            {children ? (
              children
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'clients' && <ClientManagement />}
                  {activeTab === 'bookings' && <BookingsManagement />}
                  {activeTab === 'schedules' && <ScheduleManagement />}
                  {activeTab === 'packages' && <PackagesAndPricing />}
                  {activeTab === 'content' && <ContentManagement />}
                  {activeTab === 'email' && <CommunicationSettings />}
                  {activeTab === 'live-session' && <LiveSessionConfigManagement />}
                  {activeTab === 'images' && <ImageManagement />}
                  {activeTab === 'external-apis' && <ExternalAPIManagement />}
                  {/* {activeTab === 'logo' && <LogoManagement />} */}
                  {activeTab === 'seo' && <SeoManagement />}
                  {activeTab === 'payment-methods' && <PaymentMethodManagement />}
                  {activeTab === 'payment-records' && <PaymentRecordsManagement />}
                  {activeTab === 'purchase-history' && <PurchaseHistoryManagement />}
                  {activeTab === 'settings' && <SettingsManagement />}
                  {activeTab === 'bug-reports' && <BugReportManagement ref={bugReportManagementRef} />}

                  {activeTab === 'astrology' && <AstrologyManagement />}
                  {activeTab === 'rasa-monitoring' && <RasaMonitoring />}
                  {activeTab === 'rasa-tuning' && <RasaModelTuning />}
                  {activeTab === 'conversation-logs' && <ConversationLogsManagement />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
