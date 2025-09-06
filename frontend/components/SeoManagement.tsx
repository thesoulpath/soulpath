import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Search, Globe, RefreshCw, Eye, EyeOff, Upload, Trash2 } from 'lucide-react';
import { BaseButton } from './ui/BaseButton';
import { BaseInput } from './ui/BaseInput';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';


import { useAuth } from '../hooks/useAuth';


interface SeoSettings {
  // Basic SEO
  title: string;
  description: string;
  keywords: string;
  author: string;
  
  // Open Graph / Social Media
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  ogImageFile?: string;
  
  // Twitter Card
  twitterTitle: string;
  twitterDescription: string;
  twitterImage?: string;
  twitterImageFile?: string;
  
  // Technical SEO
  robots: string;
  canonical: string;
  language: string;
  
  // Analytics
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  
  // Structured Data
  organizationName: string;
  organizationType: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  
  // Verification
  googleSiteVerification?: string;
  bingSiteVerification?: string;
}

const defaultSeoSettings: SeoSettings = {
  title: 'SoulPath - Professional Astrology Consultations with José Garfias',
  description: 'Discover your cosmic blueprint with personalized astrology readings. Professional consultations with certified astrologer José Garfias. Book your session today.',
  keywords: 'astrology, birth chart, horoscope, zodiac, natal chart, astrology reading, astrology consultation, cosmic guidance, spiritual guidance',
  author: 'José Garfias',
  
  ogTitle: 'SoulPath - Professional Astrology Consultations',
  ogDescription: 'Discover your cosmic blueprint with personalized astrology readings. Professional consultations with certified astrologer José Garfias.',
  
  twitterTitle: 'SoulPath - Professional Astrology Consultations',
  twitterDescription: 'Discover your cosmic blueprint with personalized astrology readings. Professional consultations with certified astrologer José Garfias.',
  
  robots: 'index, follow',
  canonical: 'https://soulpath.lat',
  language: 'en',
  
  organizationName: 'SoulPath Astrology',
  organizationType: 'ProfessionalService',
  contactEmail: 'info@soulpath.lat',
  contactPhone: '',
  address: ''
};

export function SeoManagement() {
  const { user } = useAuth();
  const [seoSettings, setSeoSettings] = useState<SeoSettings>(defaultSeoSettings);
  const [originalSettings, setOriginalSettings] = useState<SeoSettings>(defaultSeoSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'social' | 'technical' | 'analytics' | 'structured'>('basic');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'og' | 'twitter' | null>(null);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(seoSettings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(hasChanges);
  }, [seoSettings, originalSettings]);

  // Load SEO settings on mount
  useEffect(() => {
    loadSeoSettings();
  }, []);

  const loadSeoSettings = async () => {
    try {
      setIsLoading(true);
      
      console.log('Loading SEO settings...');
      const response = await fetch(`/api/seo`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // If no settings exist in database, use default
        const loadedSettings = { ...defaultSeoSettings, ...data.seo };
        
        console.log('SEO settings loaded successfully:', loadedSettings);
        setSeoSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      } else {
        console.log('SEO endpoint returned non-OK status:', response.status, response.statusText);
        // Use default settings on server error
        setSeoSettings(defaultSeoSettings);
        setOriginalSettings(defaultSeoSettings);
      }
    } catch (error) {
      console.error('Error loading SEO settings:', error);
      // Use default settings on error - this is not a critical failure
      setSeoSettings(defaultSeoSettings);
      setOriginalSettings(defaultSeoSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSeoSettings = async () => {
    if (!user?.access_token) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/admin/seo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ seo: seoSettings })
      });

      if (!response.ok) {
        throw new Error('Failed to save SEO settings');
      }
      
      setOriginalSettings(seoSettings);
      setHasUnsavedChanges(false);
      alert('SEO settings saved successfully!');
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      alert('Failed to save SEO settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'og' | 'twitter') => {
    if (!user?.access_token) return;
    
    try {
      setUploadingImage(type);
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', `seo-${type}`);
      
      const response = await fetch(`/api/admin/images/seo-${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      if (type === 'og') {
        setSeoSettings(prev => ({
          ...prev,
          ogImage: data.url,
          ogImageFile: data.filename
        }));
      } else {
        setSeoSettings(prev => ({
          ...prev,
          twitterImage: data.url,
          twitterImageFile: data.filename
        }));
      }
      
      alert(`${type === 'og' ? 'Open Graph' : 'Twitter'} image uploaded successfully!`);
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(null);
    }
  };

  const resetToDefault = () => {
    if (confirm('This will reset all SEO settings to default values. Are you sure?')) {
      setSeoSettings(defaultSeoSettings);
    }
  };

  const discardChanges = () => {
    if (confirm('This will discard all unsaved changes. Are you sure?')) {
      setSeoSettings(originalSettings);
    }
  };

  const updateSetting = (key: keyof SeoSettings, value: string) => {
    setSeoSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading SEO settings...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'basic', label: 'Basic SEO', icon: Search },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'technical', label: 'Technical', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: Search },
    { id: 'structured', label: 'Structured Data', icon: Search }
  ] as const;

  return (
    <div className="dashboard-container p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="dashboard-text-primary text-3xl font-bold">SEO Management</h1>
          <p className="dashboard-text-secondary">Optimize your website for search engines and social media</p>
        </div>
        
        <div className="flex flex-col items-center lg:items-end space-y-3">
          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-yellow-400 font-medium">Unsaved changes</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 lg:gap-3">
            <BaseButton
              onClick={discardChanges}
              disabled={!hasUnsavedChanges}
              variant="outline"
              size="sm"
              className="border-[var(--color-border-500)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-200"
            >
              <RefreshCw size={16} className="mr-2" />
              Discard
            </BaseButton>
            
            <BaseButton
              onClick={resetToDefault}
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
            >
              <Trash2 size={16} className="mr-2" />
              Reset All
            </BaseButton>
            
            <BaseButton
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="sm"
              className={`border-[var(--color-accent-500)]/30 text-[var(--color-accent-500)] hover:bg-[var(--color-accent-500)]/10 hover:border-[var(--color-accent-500)]/50 transition-all duration-200 ${
                showPreview ? 'bg-[var(--color-accent-500)]/10 border-[var(--color-accent-500)]/50' : ''
              }`}
            >
              {showPreview ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
              Preview
            </BaseButton>
            
            <BaseButton
              onClick={saveSeoSettings}
              disabled={isSaving || !hasUnsavedChanges}
              size="sm"
              className="dashboard-button-primary min-w-[120px]"
            >
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-[var(--color-background-primary)] border-t-transparent rounded-full mr-2"
                />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Save Changes
            </BaseButton>
          </div>
        </div>
      </div>

      {/* SEO Score Card */}
              <Card className="bg-[var(--color-surface-primary)] border-[var(--color-accent-500)]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-[#FFD700] text-2xl font-heading">{seoSettings.title ? '✓' : '✗'}</p>
              <p className="text-sm text-[#C0C0C0]">Title Tag</p>
            </div>
            <div className="text-center">
              <p className="text-[#FFD700] text-2xl font-heading">{seoSettings.description ? '✓' : '✗'}</p>
              <p className="text-sm text-[#C0C0C0]">Meta Description</p>
            </div>
            <div className="text-center">
              <p className="text-[#FFD700] text-2xl font-heading">{seoSettings.ogImage ? '✓' : '✗'}</p>
              <p className="text-sm text-[#C0C0C0]">Social Image</p>
            </div>
            <div className="text-center">
              <p className="text-[#FFD700] text-2xl font-heading">{seoSettings.organizationName ? '✓' : '✗'}</p>
              <p className="text-sm text-[#C0C0C0]">Structured Data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Selector */}
        <div className="lg:col-span-1">
          <Card className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)]">
            <CardHeader>
              <CardTitle className="text-[#EAEAEA] text-lg">SEO Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'dashboard-language-tab-active'
                          : 'dashboard-language-tab-inactive hover:bg-[var(--color-surface-secondary)]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon size={14} />
                        <span className="text-sm">{section.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Editor */}
        <div className="lg:col-span-3">
          <Card className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)]">
            <CardHeader>
              <CardTitle className="text-[#EAEAEA] text-lg">
                {sections.find(s => s.id === activeSection)?.label} Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Basic SEO */}
                {activeSection === 'basic' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[#C0C0C0]">Page Title</Label>
                      <BaseInput
                        id="title"
                        value={seoSettings.title}
                        onChange={(e) => updateSetting('title', e.target.value)}
                        placeholder="Enter page title..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                      <p className="text-xs text-[#C0C0C0]/70">
                        Length: {seoSettings.title.length}/60 characters (recommended: 50-60)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-[#C0C0C0]">Meta Description</Label>
                      <Textarea
                        id="description"
                        value={seoSettings.description}
                        onChange={(e) => updateSetting('description', e.target.value)}
                        placeholder="Enter meta description..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)] min-h-[80px]"
                      />
                      <p className="text-xs text-[#C0C0C0]/70">
                        Length: {seoSettings.description.length}/155 characters (recommended: 150-155)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="keywords" className="text-[#C0C0C0]">Keywords</Label>
                      <Textarea
                        id="keywords"
                        value={seoSettings.keywords}
                        onChange={(e) => updateSetting('keywords', e.target.value)}
                        placeholder="Enter keywords separated by commas..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)] min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="author" className="text-[#C0C0C0]">Author</Label>
                      <BaseInput
                        id="author"
                        value={seoSettings.author}
                        onChange={(e) => updateSetting('author', e.target.value)}
                        placeholder="Enter author name..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>
                  </>
                )}

                {/* Social Media */}
                {activeSection === 'social' && (
                  <>
                    <h3 className="text-lg font-heading text-[#FFD700]">Open Graph (Facebook)</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ogTitle" className="text-[#C0C0C0]">OG Title</Label>
                      <BaseInput
                        id="ogTitle"
                        value={seoSettings.ogTitle}
                        onChange={(e) => updateSetting('ogTitle', e.target.value)}
                        placeholder="Enter Open Graph title..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ogDescription" className="text-[#C0C0C0]">OG Description</Label>
                      <Textarea
                        id="ogDescription"
                        value={seoSettings.ogDescription}
                        onChange={(e) => updateSetting('ogDescription', e.target.value)}
                        placeholder="Enter Open Graph description..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)] min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#C0C0C0]">OG Image</Label>
                      {seoSettings.ogImage && (
                        <div className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border-500)] rounded-lg">
                          <img src={seoSettings.ogImage} alt="OG Preview" className="max-h-32 object-contain" />
                        </div>
                      )}
                      <input
                        type="file"
                        id="og-upload"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'og');
                        }}
                        className="hidden"
                      />
                      <BaseButton
                        onClick={() => document.getElementById('og-upload')?.click()}
                        variant="outline"
                        disabled={uploadingImage === 'og'}
                        className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                      >
                        {uploadingImage === 'og' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full mr-2"
                          />
                        ) : (
                          <Upload size={16} className="mr-2" />
                        )}
                        Upload OG Image
                      </BaseButton>
                      <p className="text-xs text-[#C0C0C0]/70">
                        Recommended: 1200x630px JPG or PNG
                      </p>
                    </div>

                    <h3 className="text-lg font-heading text-[#FFD700] mt-6">Twitter Card</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="twitterTitle" className="text-[#C0C0C0]">Twitter Title</Label>
                      <BaseInput
                        id="twitterTitle"
                        value={seoSettings.twitterTitle}
                        onChange={(e) => updateSetting('twitterTitle', e.target.value)}
                        placeholder="Enter Twitter title..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitterDescription" className="text-[#C0C0C0]">Twitter Description</Label>
                      <Textarea
                        id="twitterDescription"
                        value={seoSettings.twitterDescription}
                        onChange={(e) => updateSetting('twitterDescription', e.target.value)}
                        placeholder="Enter Twitter description..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)] min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#C0C0C0]">Twitter Image</Label>
                      {seoSettings.twitterImage && (
                        <div className="p-3 bg-[var(--color-surface-secondary)] border border-[var(--color-border-500)] rounded-lg">
                          <img src={seoSettings.twitterImage} alt="Twitter Preview" className="max-h-32 object-contain" />
                        </div>
                      )}
                      <input
                        type="file"
                        id="twitter-upload"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'twitter');
                        }}
                        className="hidden"
                      />
                      <BaseButton
                        onClick={() => document.getElementById('twitter-upload')?.click()}
                        variant="outline"
                        disabled={uploadingImage === 'twitter'}
                        className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10"
                      >
                        {uploadingImage === 'twitter' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full mr-2"
                          />
                        ) : (
                          <Upload size={16} className="mr-2" />
                        )}
                        Upload Twitter Image
                      </BaseButton>
                    </div>
                  </>
                )}

                {/* Technical SEO */}
                {activeSection === 'technical' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="robots" className="text-[#C0C0C0]">Robots Meta Tag</Label>
                      <BaseInput
                        id="robots"
                        value={seoSettings.robots}
                        onChange={(e) => updateSetting('robots', e.target.value)}
                        placeholder="e.g., index, follow"
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="canonical" className="text-[#C0C0C0]">Canonical URL</Label>
                      <BaseInput
                        id="canonical"
                        value={seoSettings.canonical}
                        onChange={(e) => updateSetting('canonical', e.target.value)}
                        placeholder="https://soulpath.lat"
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-[#C0C0C0]">Language Code</Label>
                      <BaseInput
                        id="language"
                        value={seoSettings.language}
                        onChange={(e) => updateSetting('language', e.target.value)}
                        placeholder="en"
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="googleSiteVerification" className="text-[#C0C0C0]">Google Site Verification</Label>
                      <BaseInput
                        id="googleSiteVerification"
                        value={seoSettings.googleSiteVerification || ''}
                        onChange={(e) => updateSetting('googleSiteVerification', e.target.value)}
                        placeholder="Enter verification code..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bingSiteVerification" className="text-[#C0C0C0]">Bing Site Verification</Label>
                      <BaseInput
                        id="bingSiteVerification"
                        value={seoSettings.bingSiteVerification || ''}
                        onChange={(e) => updateSetting('bingSiteVerification', e.target.value)}
                        placeholder="Enter verification code..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>
                  </>
                )}

                {/* Analytics */}
                {activeSection === 'analytics' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="googleAnalyticsId" className="text-[#C0C0C0]">Google Analytics ID</Label>
                      <BaseInput
                        id="googleAnalyticsId"
                        value={seoSettings.googleAnalyticsId || ''}
                        onChange={(e) => updateSetting('googleAnalyticsId', e.target.value)}
                        placeholder="GA4-XXXXXXXXX"
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="googleTagManagerId" className="text-[#C0C0C0]">Google Tag Manager ID</Label>
                      <BaseInput
                        id="googleTagManagerId"
                        value={seoSettings.googleTagManagerId || ''}
                        onChange={(e) => updateSetting('googleTagManagerId', e.target.value)}
                        placeholder="GTM-XXXXXXX"
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebookPixelId" className="text-[#C0C0C0]">Facebook Pixel ID</Label>
                      <BaseInput
                        id="facebookPixelId"
                        value={seoSettings.facebookPixelId || ''}
                        onChange={(e) => updateSetting('facebookPixelId', e.target.value)}
                        placeholder="Enter Facebook Pixel ID..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>
                  </>
                )}

                {/* Structured Data */}
                {activeSection === 'structured' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="organizationName" className="text-[#C0C0C0]">Organization Name</Label>
                      <BaseInput
                        id="organizationName"
                        value={seoSettings.organizationName}
                        onChange={(e) => updateSetting('organizationName', e.target.value)}
                        placeholder="SoulPath Astrology"
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organizationType" className="text-[#C0C0C0]">Organization Type</Label>
                      <BaseInput
                        id="organizationType"
                        value={seoSettings.organizationType}
                        onChange={(e) => updateSetting('organizationType', e.target.value)}
                        placeholder="ProfessionalService"
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail" className="text-[#C0C0C0]">Contact Email</Label>
                      <BaseInput
                        id="contactEmail"
                        value={seoSettings.contactEmail}
                        onChange={(e) => updateSetting('contactEmail', e.target.value)}
                        placeholder="info@soulpath.lat"
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="text-[#C0C0C0]">Contact Phone</Label>
                      <BaseInput
                        id="contactPhone"
                        value={seoSettings.contactPhone}
                        onChange={(e) => updateSetting('contactPhone', e.target.value)}
                        placeholder="+1-XXX-XXX-XXXX"
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-[#C0C0C0]">Business Address</Label>
                      <Textarea
                        id="address"
                        value={seoSettings.address}
                        onChange={(e) => updateSetting('address', e.target.value)}
                        placeholder="Enter business address..."
                        className="bg-[var(--color-surface-secondary)] border-[var(--color-border-500)] text-[var(--color-text-primary)] min-h-[60px]"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <Card className="bg-[var(--color-surface-primary)] border-[var(--color-border-500)]">
          <CardHeader>
            <CardTitle className="text-[#EAEAEA] text-lg">SEO Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Google Search Result Preview */}
              <div>
                <h3 className="text-lg font-heading text-[#FFD700] mb-3">Google Search Result</h3>
                <div className="p-4 bg-white rounded-lg">
                  <div className="text-blue-600 text-lg hover:underline cursor-pointer">{seoSettings.title}</div>
                  <div className="text-green-700 text-sm">{seoSettings.canonical}</div>
                  <div className="text-gray-600 text-sm mt-1">{seoSettings.description}</div>
                </div>
              </div>

              {/* Social Media Preview */}
              {seoSettings.ogImage && (
                <div>
                  <h3 className="text-lg font-heading text-[#FFD700] mb-3">Facebook Preview</h3>
                  <div className="border border-gray-300 rounded-lg bg-white max-w-md">
                    <img src={seoSettings.ogImage} alt="OG Preview" className="w-full h-48 object-cover rounded-t-lg" />
                    <div className="p-3">
                      <div className="font-semibold text-black">{seoSettings.ogTitle}</div>
                      <div className="text-gray-600 text-sm">{seoSettings.ogDescription}</div>
                      <div className="text-gray-500 text-xs uppercase">{seoSettings.canonical}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {hasUnsavedChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Card className="bg-[var(--color-surface-primary)]/95 backdrop-blur-lg border-[var(--color-accent-500)]/40 shadow-xl shadow-[var(--color-accent-500)]/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-x-4">
                {/* Status Indicator */}
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-[var(--color-text-primary)] text-sm font-medium">Unsaved changes</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <BaseButton
                    onClick={discardChanges}
                    variant="outline"
                    size="sm"
                    className="border-[var(--color-border-500)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-200 min-w-[80px]"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Discard
                  </BaseButton>
                  
                  <BaseButton
                    onClick={saveSeoSettings}
                    disabled={isSaving}
                    size="sm"
                    className="dashboard-button-primary min-w-[80px]"
                  >
                    {isSaving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-2 border-[var(--color-background-primary)] border-t-transparent rounded-full mr-1"
                      />
                    ) : (
                      <Save size={14} className="mr-1" />
                    )}
                    Save
                  </BaseButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}