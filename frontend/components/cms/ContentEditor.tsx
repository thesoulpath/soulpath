'use client';

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Eye, EyeOff, FileText, Star, User, Compass, Clock } from 'lucide-react';
import { CMSInput } from './CMSInput';
import { CMSButton } from './CMSButton';
import { useToast } from './Toast';

interface ContentStructure {
  [key: string]: string | Record<string, string>;
}

interface ContentEditorProps {
  content: ContentStructure;
  onContentChange: (content: ContentStructure) => void;
  onSave: () => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
}

export function ContentEditor({
  content,
  onContentChange,
  onSave,
  onRefresh,
  isLoading,
  isSaving
}: ContentEditorProps) {
  const { showSuccess, showError } = useToast();
  const [previewMode, setPreviewMode] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalContent(content);
    setHasChanges(false);
  }, [content]);

  const handleFieldChange = (field: string, value: string, language?: string) => {
    const newContent = { ...localContent };
    
    if (language) {
      // Handle language-specific fields
      if (!newContent[`${field}${language.charAt(0).toUpperCase() + language.slice(1)}`]) {
        newContent[`${field}${language.charAt(0).toUpperCase() + language.slice(1)}`] = '';
      }
      newContent[`${field}${language.charAt(0).toUpperCase() + language.slice(1)}`] = value;
    } else {
      // Handle non-language fields
      newContent[field] = value;
    }
    
    setLocalContent(newContent);
    setHasChanges(true);
    onContentChange(newContent);
  };

  const handleSave = async () => {
    try {
      await onSave();
      setHasChanges(false);
      showSuccess('Content Saved!', 'Your changes have been saved and the page will be revalidated.', 4000);
    } catch {
      showError('Save Failed', 'Failed to save content. Please try again.', 6000);
    }
  };

  const handleRefresh = async () => {
    try {
      await onRefresh();
      setHasChanges(false);
      showSuccess('Content Refreshed!', 'Content has been refreshed from the server.', 3000);
    } catch {
      showError('Refresh Failed', 'Failed to refresh content. Please try again.', 6000);
    }
  };

  const resetChanges = () => {
    setLocalContent(content);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9CA3AF]">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between bg-[#1A1A2E] p-4 rounded-lg border border-[#2D2D44]">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-[#EAEAEA] flex items-center">
            <FileText size={20} className="mr-2 text-[#FFD700]" />
            Front Page Content Editor
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                previewMode 
                  ? 'bg-[#FFD700] text-[#0A0A23]' 
                  : 'bg-[#2D2D44] text-[#EAEAEA] hover:bg-[#3D3D54]'
              }`}
            >
              {previewMode ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
              {previewMode ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-[#FFD700] text-sm font-medium">Unsaved changes</span>
          )}
          <CMSButton
            onClick={resetChanges}
            disabled={!hasChanges}
            variant="secondary"
            size="sm"
          >
            Reset
          </CMSButton>
          <CMSButton
            onClick={handleRefresh}
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </CMSButton>
          <CMSButton
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            variant="primary"
            size="sm"
          >
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save & Revalidate'}
          </CMSButton>
        </div>
      </div>

      {/* Content Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hero Section */}
        <div className="bg-[#1A1A2E] p-6 rounded-lg border border-[#2D2D44]">
          <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center">
            <Star size={18} className="mr-2" />
            Hero Section
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">English Title</label>
              <CMSInput
                value={typeof localContent.heroTitleEn === 'string' ? localContent.heroTitleEn : ''}
                onChange={(value) => handleFieldChange('heroTitle', value, 'en')}
                placeholder="Welcome to SOULPATH"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Spanish Title</label>
              <CMSInput
                value={typeof localContent.heroTitleEs === 'string' ? localContent.heroTitleEs : ''}
                onChange={(value) => handleFieldChange('heroTitle', value, 'es')}
                placeholder="Bienvenido a SOULPATH"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">English Subtitle</label>
              <CMSInput
                value={typeof localContent.heroSubtitleEn === 'string' ? localContent.heroSubtitleEn : ''}
                onChange={(value) => handleFieldChange('heroSubtitle', value, 'en')}
                placeholder="Your journey to wellness starts here"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Spanish Subtitle</label>
              <CMSInput
                value={typeof localContent.heroSubtitleEs === 'string' ? localContent.heroSubtitleEs : ''}
                onChange={(value) => handleFieldChange('heroSubtitle', value, 'es')}
                placeholder="Tu camino al bienestar comienza aquí"
              />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-[#1A1A2E] p-6 rounded-lg border border-[#2D2D44]">
          <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center">
            <User size={18} className="mr-2" />
            About Section
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">English Title</label>
              <CMSInput
                value={typeof localContent.aboutTitleEn === 'string' ? localContent.aboutTitleEn : ''}
                onChange={(value) => handleFieldChange('aboutTitle', value, 'en')}
                placeholder="About Us"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Spanish Title</label>
              <CMSInput
                value={typeof localContent.aboutTitleEs === 'string' ? localContent.aboutTitleEs : ''}
                onChange={(value) => handleFieldChange('aboutTitle', value, 'es')}
                placeholder="Sobre Nosotros"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">English Content</label>
              <textarea
                value={typeof localContent.aboutContentEn === 'string' ? localContent.aboutContentEn : ''}
                onChange={(e) => handleFieldChange('aboutContent', e.target.value, 'en')}
                placeholder="We are dedicated to helping you achieve your wellness goals."
                className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Spanish Content</label>
              <textarea
                value={typeof localContent.aboutContentEs === 'string' ? localContent.aboutContentEs : ''}
                onChange={(e) => handleFieldChange('aboutContent', e.target.value, 'es')}
                placeholder="Estamos dedicados a ayudarte a alcanzar tus metas de bienestar."
                className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Approach Section */}
        <div className="bg-[#1A1A2E] p-6 rounded-lg border border-[#2D2D44]">
          <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center">
            <Compass size={18} className="mr-2" />
            Approach Section
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">English Title</label>
              <CMSInput
                value={typeof localContent.approachTitleEn === 'string' ? localContent.approachTitleEn : ''}
                onChange={(value) => handleFieldChange('approachTitle', value, 'en')}
                placeholder="Our Approach"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Spanish Title</label>
              <CMSInput
                value={typeof localContent.approachTitleEs === 'string' ? localContent.approachTitleEs : ''}
                onChange={(value) => handleFieldChange('approachTitle', value, 'es')}
                placeholder="Nuestro Enfoque"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">English Content</label>
              <textarea
                value={typeof localContent.approachContentEn === 'string' ? localContent.approachContentEn : ''}
                onChange={(e) => handleFieldChange('approachContent', e.target.value, 'en')}
                placeholder="We use a holistic approach to wellness."
                className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Spanish Content</label>
              <textarea
                value={typeof localContent.approachContentEs === 'string' ? localContent.approachContentEs : ''}
                onChange={(e) => handleFieldChange('approachContent', e.target.value, 'es')}
                placeholder="Usamos un enfoque holístico para el bienestar."
                className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-[#1A1A2E] p-6 rounded-lg border border-[#2D2D44]">
          <h3 className="text-lg font-semibold text-[#FFD700] mb-4 flex items-center">
            <Clock size={18} className="mr-2" />
            Services Section
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">English Title</label>
              <CMSInput
                value={typeof localContent.servicesTitleEn === 'string' ? localContent.servicesTitleEn : ''}
                onChange={(value) => handleFieldChange('servicesTitle', value, 'en')}
                placeholder="Our Services"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Spanish Title</label>
              <CMSInput
                value={typeof localContent.servicesTitleEs === 'string' ? localContent.servicesTitleEs : ''}
                onChange={(value) => handleFieldChange('servicesTitle', value, 'es')}
                placeholder="Nuestros Servicios"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">English Content</label>
              <textarea
                value={typeof localContent.servicesContentEn === 'string' ? localContent.servicesContentEn : ''}
                onChange={(e) => handleFieldChange('servicesContent', e.target.value, 'en')}
                placeholder="Professional wellness services in a peaceful environment."
                className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Spanish Content</label>
              <textarea
                value={typeof localContent.servicesContentEs === 'string' ? localContent.servicesContentEs : ''}
                onChange={(e) => handleFieldChange('servicesContent', e.target.value, 'es')}
                placeholder="Servicios profesionales de bienestar en un ambiente pacífico."
                className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <div className="bg-[#1A1A2E] p-6 rounded-lg border border-[#2D2D44]">
          <h3 className="text-lg font-semibold text-[#FFD700] mb-4">Content Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-[#EAEAEA] mb-3">English Version</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Hero:</strong> {typeof localContent.heroTitleEn === 'string' ? localContent.heroTitleEn || 'Welcome to SOULPATH' : 'Welcome to SOULPATH'}</p>
                <p><strong>Subtitle:</strong> {typeof localContent.heroSubtitleEn === 'string' ? localContent.heroSubtitleEn || 'Your journey to wellness starts here' : 'Your journey to wellness starts here'}</p>
                <p><strong>About:</strong> {typeof localContent.aboutTitleEn === 'string' ? localContent.aboutTitleEn || 'About Us' : 'About Us'}</p>
                <p><strong>Approach:</strong> {typeof localContent.approachTitleEn === 'string' ? localContent.approachTitleEn || 'Our Approach' : 'Our Approach'}</p>
                <p><strong>Services:</strong> {typeof localContent.servicesTitleEn === 'string' ? localContent.servicesTitleEn || 'Our Services' : 'Our Services'}</p>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium text-[#EAEAEA] mb-3">Spanish Version</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Hero:</strong> {typeof localContent.heroTitleEs === 'string' ? localContent.heroTitleEs || 'Bienvenido a SOULPATH' : 'Bienvenido a SOULPATH'}</p>
                <p><strong>Subtitle:</strong> {typeof localContent.heroSubtitleEs === 'string' ? localContent.heroSubtitleEs || 'Tu camino al bienestar comienza aquí' : 'Tu camino al bienestar comienza aquí'}</p>
                <p><strong>About:</strong> {typeof localContent.aboutTitleEs === 'string' ? localContent.aboutTitleEs || 'Sobre Nosotros' : 'Sobre Nosotros'}</p>
                <p><strong>Approach:</strong> {typeof localContent.approachTitleEs === 'string' ? localContent.approachTitleEs || 'Nuestro Enfoque' : 'Nuestro Enfoque'}</p>
                <p><strong>Services:</strong> {typeof localContent.servicesTitleEs === 'string' ? localContent.servicesTitleEs || 'Nuestros Servicios' : 'Nuestros Servicios'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
