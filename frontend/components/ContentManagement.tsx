'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, FileText, Globe, RefreshCw, Save, AlertCircle, Loader2, Database } from 'lucide-react';
import { BaseButton } from './ui/BaseButton';
import { useAuth } from '../hooks/useAuth';

import { SectionConfig, DEFAULT_SECTIONS } from '@/lib/content-config';
import { CMSTabs } from './cms/CMSTabs';
import { ContentEditor } from './cms/ContentEditor';
import { SectionManager } from './cms/SectionManager';
import { TranslationManager } from './cms/TranslationManager';
import { useToast, ToastContainer } from './cms/Toast';
import { CMSButton } from './cms/CMSButton';

// Content types - matches ContentEditor interface
interface ContentStructure {
  [key: string]: string | Record<string, string>;
}

interface ContentManagementProps {
  onClose?: () => void;
}

// Default content structure that matches the API response format
const DEFAULT_CONTENT: ContentStructure = {
  heroTitleEn: 'Welcome to SOULPATH',
  heroTitleEs: 'Bienvenido a SOULPATH',
  heroSubtitleEn: 'Your journey to wellness starts here',
  heroSubtitleEs: 'Tu camino al bienestar comienza aquí',
  aboutTitleEn: 'About Us',
  aboutTitleEs: 'Sobre Nosotros',
  aboutContentEn: 'We are dedicated to helping you achieve your wellness goals.',
  aboutContentEs: 'Estamos dedicados a ayudarte a alcanzar tus metas de bienestar.',
  approachTitleEn: 'Our Approach',
  approachTitleEs: 'Nuestro Enfoque',
  approachContentEn: 'We use a holistic approach to wellness.',
  approachContentEs: 'Usamos un enfoque holístico para el bienestar.',
  servicesTitleEn: 'Our Services',
  servicesTitleEs: 'Nuestros Servicios',
  servicesContentEn: 'Professional wellness services in a peaceful environment.',
  servicesContentEs: 'Servicios profesionales de bienestar en un ambiente pacífico.'
};

export function ContentManagement({ }: ContentManagementProps) {
  const { user } = useAuth();
  const { toasts, showSuccess, showError, showWarning } = useToast();

  // State management
  const [content, setContent] = useState<ContentStructure>(DEFAULT_CONTENT);
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'sections' | 'i18n'>('content');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);



  // Load content from API
  const loadContent = useCallback(async () => {
    try {
      console.log('🔍 Loading content data...');

      if (!user?.access_token) {
        console.log('❌ No access token available');
        setError('Authentication required to load content');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/admin/content', {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.content && typeof data.content === 'object') {
        console.log('✅ Content loaded successfully:', data.fieldsCount || Object.keys(data.content).length, 'fields');
        setContent({ ...DEFAULT_CONTENT, ...data.content });
        setHasUnsavedChanges(false);
        setLastLoaded(new Date());
        setError(null);
        setRetryCount(0); // Reset retry count on success

        if (lastLoaded) {
          showSuccess('Content Refreshed', 'Content data has been updated successfully.', 3000);
        }

        // Log additional metadata if available
        if (data.isDefault) {
          console.log('ℹ️ Using default content (new installation)');
        }
      } else {
        throw new Error(data.message || 'Invalid API response format');
      }
    } catch (error) {
      console.error('❌ Error loading content:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timeout - please try again');
        showError('Timeout', 'Request timed out. Please try again.', 5000);
      } else {
        setError('Failed to load content data');
        showError('Load Failed', 'Failed to load content from server.', 5000);
      }

      // Keep existing content if available, otherwise use defaults
      setContent(prev => Object.keys(prev).length > 0 ? prev : DEFAULT_CONTENT);
    }
  }, [user?.access_token, showError, showSuccess, lastLoaded]);

  // Load sections from API
  const loadSections = useCallback(async () => {
    try {
      console.log('🔍 Loading sections data...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch('/api/sections', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.sections && Array.isArray(data.sections)) {
        console.log('✅ Sections loaded successfully:', data.sections.length, 'sections');
        setSections(data.sections);
        setError(null);

        // Log additional metadata if available
        if (data.source) {
          console.log(`ℹ️ Sections loaded from: ${data.source}`);
        }
        if (data.message) {
          console.log(`ℹ️ ${data.message}`);
        }
      } else {
        throw new Error(data.message || 'Invalid API response format');
      }
    } catch (error) {
      console.error('❌ Error loading sections:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        showWarning('Timeout', 'Request timed out loading sections.', 4000);
      } else {
        showWarning('Sections Warning', 'Using default section configuration.', 4000);
      }

      // Keep existing sections if available, otherwise use defaults
      setSections(prev => prev.length > 0 ? prev : DEFAULT_SECTIONS);
    }
  }, [showWarning]);

  // Load all data with proper error handling
  const fetchAllData = useCallback(async () => {
    try {
      console.log('🔍 Starting data load process...');
      console.log('🔍 User authenticated:', !!user?.access_token);

      if (!user?.access_token) {
        console.log('❌ No access token available');
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log('📡 Loading content and sections...');

      // Load data with timeout and error handling
      const loadPromise = Promise.allSettled([
        loadContent(),
        loadSections()
      ]);

      const results = await loadPromise;

      // Check results and log any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn('⚠️ Some data loading failed:', failures);
      }

      const successes = results.filter(result => result.status === 'fulfilled');
      if (successes.length > 0) {
        console.log('✅ Data loading completed');
        setRetryCount(0); // Reset retry count on success
      }

      setLastLoaded(new Date());

    } catch (error) {
      console.error('❌ Critical error in fetchAllData:', error);
      setError('Failed to load data');
      showError('Data Load Error', 'Failed to load content data. Please try again.', 5000);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadContent, loadSections, showError]);

  // Manual refresh function with retry logic
  const refreshContentData = useCallback(() => {
    if (user?.access_token) {
      console.log('🔄 Manual refresh requested...');
      setRetryCount(prev => prev + 1);
      fetchAllData();
    } else {
      console.log('❌ Cannot refresh: no access token');
    }
  }, [user?.access_token, fetchAllData]);

  // Main data loading effect
  useEffect(() => {
    if (user?.access_token && !lastLoaded) {
      console.log('🔄 Initial data load triggered');
      fetchAllData();
    } else if (!user?.access_token) {
      console.log('🚫 User not authenticated - resetting to defaults');
      setContent(DEFAULT_CONTENT);
      setSections(DEFAULT_SECTIONS);
      setIsLoading(false);
      setError('Authentication required');
    }
  }, [user?.access_token, lastLoaded, fetchAllData]);

  // Handle authentication state changes
  useEffect(() => {
    if (user?.access_token && !lastLoaded && !isLoading) {
      console.log('🔐 Authentication restored - reloading data');
      fetchAllData();
    }
  }, [user?.access_token, lastLoaded, isLoading, fetchAllData]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.access_token && lastLoaded) {
        const timeSinceLastLoad = Date.now() - lastLoaded.getTime();
        // Refresh if data is older than 5 minutes
        if (timeSinceLastLoad > 5 * 60 * 1000) {
          console.log('👁️ Tab became visible - refreshing stale data');
          fetchAllData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.access_token, lastLoaded, fetchAllData]);

  // Global refresh function for debugging
  useEffect(() => {
    // @ts-expect-error - Exposing refresh function globally for debugging
    window.refreshContentData = refreshContentData;

    return () => {
      // @ts-expect-error - Clean up global function
      delete window.refreshContentData;
    };
  }, [refreshContentData]);

  // Save content with improved error handling
  const saveContent = useCallback(async () => {
    if (!user?.access_token) {
      showError('Authentication Error', 'Please log in to save content.', 6000);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      console.log('💾 Saving content data...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const savedData = await response.json();

      if (savedData.success && savedData.content) {
        console.log('✅ Content saved successfully');
        setContent(savedData.content);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setError(null);

        showSuccess('Content Saved!', savedData.message || 'Your changes have been saved successfully.', 4000);

        // Log processing time if available
        if (savedData.processingTime) {
          console.log(`⚡ Save operation completed in ${savedData.processingTime}`);
        }

        // Note: Revalidation is now handled by the API itself
        console.log('✅ Page revalidation triggered by API');
      } else {
        throw new Error(savedData.message || 'Invalid API response format');
      }

    } catch (error) {
      console.error('❌ Error saving content:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        setError('Save request timed out');
        showError('Timeout', 'Save request timed out. Please try again.', 5000);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Save failed: ${errorMessage}`);
        showError('Save Failed', `Failed to save content: ${errorMessage}`, 6000);
      }
    } finally {
      setIsSaving(false);
    }
  }, [user?.access_token, content, showError, showSuccess, showWarning]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: ContentStructure) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    setError(null);
  }, []);

  // Handle sections changes
  const handleSectionsChange = useCallback((newSections: SectionConfig[]) => {
    setSections(newSections);
    setHasUnsavedChanges(true);
  }, []);

  // Handle tab changes with unsaved changes protection
  const handleTabChange = useCallback((tabId: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to switch tabs? Your changes will be lost.'
      );
      if (!confirmed) return;
      setHasUnsavedChanges(false);
    }
    setActiveTab(tabId as 'content' | 'sections' | 'i18n');
  }, [hasUnsavedChanges]);

  // Handle manual refresh with confirmation
  const handleRefresh = useCallback(async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Refreshing will discard them. Continue?'
      );
      if (!confirmed) return;
    }

    setError(null);
    await fetchAllData();
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, fetchAllData]);

  // Retry function for failed loads
  const handleRetry = useCallback(() => {
    console.log('🔄 Retry requested');
    setRetryCount(prev => prev + 1);
    fetchAllData();
  }, [fetchAllData]);

  // Loading state with better UX
  if (isLoading && !lastLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-[#FFD700]" />
          <p className="text-[#FFD700] text-lg font-semibold">Loading Content Management</p>
          <p className="text-gray-400 text-sm mt-2">
            {retryCount > 0 ? `Retrying... (attempt ${retryCount + 1})` : 'Fetching data from server...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-white mb-2">Content Loading Error</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <BaseButton
              variant="outline"
              onClick={handleRetry}
              className="dashboard-button-outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </BaseButton>
            <BaseButton
              variant="outline"
              onClick={refreshContentData}
              className="dashboard-button-outline"
            >
              <Database className="w-4 h-4 mr-2" />
              Refresh All
            </BaseButton>
          </div>
        </div>
      </div>
    );
  }

  // Tab configuration
  const tabs = [
    {
      id: 'content',
      label: 'Content Editor',
      icon: <FileText size={16} />,
      content: (
        <ContentEditor
          content={content}
          onContentChange={handleContentChange}
          onSave={saveContent}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          isSaving={isSaving}
        />
      )
    },
    {
      id: 'sections',
      label: 'Section Management',
      icon: <Settings size={16} />,
      content: (
        <SectionManager
          sections={sections}
          onSectionsChange={handleSectionsChange}
        />
      )
    },
    {
      id: 'i18n',
      label: 'Translation Manager',
      icon: <Globe size={16} />,
      content: (
        <TranslationManager
          content={content}
          onContentChange={handleContentChange}
          onSave={saveContent}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          isSaving={isSaving}
        />
      )
    }
  ];

  // Authentication loading state
  if (!user?.access_token && !lastLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A23] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#FFD700]" />
          <p className="text-[#EAEAEA] text-lg">Authenticating...</p>
          <p className="text-[#9CA3AF] text-sm mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A23] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#EAEAEA] mb-2">Content Management System</h1>
              <p className="text-[#9CA3AF]">Manage your website content, sections, and translations with ISR support</p>
              {lastLoaded && (
                <p className="text-sm text-gray-400 mt-1">
                  Last loaded: {lastLoaded.toLocaleString()}
                </p>
              )}
              {retryCount > 0 && (
                <p className="text-sm text-yellow-400 mt-1">
                  Retry attempts: {retryCount}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <BaseButton
                variant="outline"
                className="dashboard-button-outline"
                onClick={refreshContentData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </BaseButton>

              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-[#FFD700]/20 border border-[#FFD700]/30 rounded-lg">
                  <AlertCircle size={16} className="text-[#FFD700]" />
                  <span className="text-[#FFD700] text-sm font-medium">Unsaved changes</span>
                </div>
              )}

              {lastSaved && (
                <div className="text-right">
                  <p className="text-[#9CA3AF] text-sm">Last saved</p>
                  <p className="text-[#EAEAEA] text-sm font-medium">
                    {lastSaved.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Status Bar */}
          <div className="bg-[#1A1A2E] p-4 rounded-lg border border-[#2D2D44]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${user?.access_token ? 'bg-[#10B981]' : 'bg-red-500'}`}></div>
                  <span className="text-[#EAEAEA] text-sm">
                    {user?.access_token ? 'Authenticated' : 'Not Authenticated'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-[#10B981]'}`}></div>
                  <span className="text-[#EAEAEA] text-sm">
                    {error ? 'Error' : 'Operational'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#3B82F6] rounded-full"></div>
                  <span className="text-[#EAEAEA] text-sm">ISR Enabled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#8B5CF6] rounded-full"></div>
                  <span className="text-[#EAEAEA] text-sm">
                    {Object.keys(content).length} fields loaded
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CMSButton
                  onClick={handleRefresh}
                  disabled={isLoading}
                  variant="secondary"
                  size="sm"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh All
                </CMSButton>

                {hasUnsavedChanges && (
                  <CMSButton
                    onClick={saveContent}
                    disabled={isSaving}
                    variant="primary"
                    size="sm"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </CMSButton>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Tabs */}
        <div className="bg-[#1A1A2E] rounded-lg border border-[#2D2D44] overflow-hidden">
          <CMSTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={() => {}} />
    </div>
  );
}
