'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Save, RefreshCw, Eye, EyeOff, Languages, FileText } from 'lucide-react';
import { CMSInput } from './CMSInput';
import { CMSButton } from './CMSButton';
import { useToast } from './Toast';

interface TranslationContent {
  [key: string]: string | Record<string, string>;
}

interface TranslationManagerProps {
  content: TranslationContent;
  onContentChange: (content: TranslationContent) => void;
  onSave: () => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
}

export function TranslationManager({
  content,
  onContentChange,
  onSave,
  onRefresh,
  isLoading,
  isSaving
}: TranslationManagerProps) {
  const { showSuccess, showError } = useToast();
  const [previewMode, setPreviewMode] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'es'>('en');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLocalContent(content);
    setHasChanges(false);
  }, [content]);

  const handleFieldChange = (field: string, value: string, language: 'en' | 'es') => {
    const newContent = { ...localContent };
    
    // Handle language-specific fields
    const fieldKey = `${field}${language.charAt(0).toUpperCase() + language.slice(1)}`;
    newContent[fieldKey] = value;
    
    setLocalContent(newContent);
    setHasChanges(true);
    onContentChange(newContent);
  };

  const handleSave = async () => {
    try {
      await onSave();
      setHasChanges(false);
      showSuccess('Translations Saved!', 'Your translation changes have been saved and the page will be revalidated.', 4000);
    } catch (_error) {
      showError('Save Failed', 'Failed to save translations. Please try again.', 6000);
    }
  };

  const handleRefresh = async () => {
    try {
      await onRefresh();
      setHasChanges(false);
      showSuccess('Translations Refreshed!', 'Translations have been refreshed from the server.', 3000);
    } catch (_error) {
      showError('Refresh Failed', 'Failed to refresh translations. Please try again.', 6000);
    }
  };

  const resetChanges = () => {
    setLocalContent(content);
    setHasChanges(false);
  };

  const getTranslationFields = () => {
    const fields = [
      { key: 'heroTitle', label: 'Hero Title', en: content.heroTitleEn, es: content.heroTitleEs },
      { key: 'heroSubtitle', label: 'Hero Subtitle', en: content.heroSubtitleEn, es: content.heroSubtitleEs },
      { key: 'aboutTitle', label: 'About Title', en: content.aboutTitleEn, es: content.aboutTitleEs },
      { key: 'aboutContent', label: 'About Content', en: content.aboutContentEn, es: content.aboutContentEs },
      { key: 'approachTitle', label: 'Approach Title', en: content.approachTitleEn, es: content.approachTitleEs },
      { key: 'approachContent', label: 'Approach Content', en: content.approachContentEn, es: content.approachContentEs },
      { key: 'servicesTitle', label: 'Services Title', en: content.servicesTitleEn, es: content.servicesTitleEs },
      { key: 'servicesContent', label: 'Services Content', en: content.servicesContentEn, es: content.servicesContentEs }
    ];

    if (searchTerm) {
      return fields.filter(field => 
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof field.en === 'string' ? field.en.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        (typeof field.es === 'string' ? field.es.toLowerCase().includes(searchTerm.toLowerCase()) : false)
      );
    }

    return fields;
  };

  const getFieldValue = (fieldKey: string, language: 'en' | 'es') => {
    const fullKey = `${fieldKey}${language.charAt(0).toUpperCase() + language.slice(1)}`;
    const value = localContent[fullKey];
    return typeof value === 'string' ? value : '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9CA3AF]">Loading translations...</p>
        </div>
      </div>
    );
  }

  const translationFields = getTranslationFields();

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between bg-[#1A1A2E] p-4 rounded-lg border border-[#2D2D44]">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-[#EAEAEA] flex items-center">
            <Globe size={20} className="mr-2 text-[#FFD700]" />
            Translation Manager
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

      {/* Language Selector */}
      <div className="bg-[#1A1A2E] p-4 rounded-lg border border-[#2D2D44]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#FFD700] flex items-center">
            <Languages size={18} className="mr-2" />
            Language Selection
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveLanguage('en')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeLanguage === 'en'
                  ? 'bg-[#FFD700] text-[#0A0A23]'
                  : 'bg-[#2D2D44] text-[#EAEAEA] hover:bg-[#3D3D54]'
              }`}
            >
              🇺🇸 English
            </button>
            <button
              onClick={() => setActiveLanguage('es')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeLanguage === 'es'
                  ? 'bg-[#FFD700] text-[#0A0A23]'
                  : 'bg-[#2D2D44] text-[#EAEAEA] hover:bg-[#3D3D54]'
              }`}
            >
              🇪🇸 Español
            </button>
          </div>
        </div>
        
        <p className="text-[#9CA3AF] text-sm">
          Currently editing: <span className="text-[#FFD700] font-medium">
            {activeLanguage === 'en' ? 'English' : 'Spanish'}
          </span> translations
        </p>
      </div>

      {/* Search */}
      <div className="bg-[#1A1A2E] p-4 rounded-lg border border-[#2D2D44]">
        <div className="relative">
          <input
            type="text"
            placeholder="Search translations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
          />
          <FileText size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]" />
        </div>
      </div>

      {/* Translation Fields */}
      <div className="space-y-4">
        {translationFields.map((field) => (
          <div key={field.key} className="bg-[#1A1A2E] p-6 rounded-lg border border-[#2D2D44]">
            <h4 className="text-lg font-semibold text-[#FFD700] mb-4">{field.label}</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* English */}
              <div>
                <label className="block text-sm font-medium text-[#EAEAEA] mb-2">
                  🇺🇸 English
                </label>
                {field.key.includes('Content') ? (
                  <textarea
                    value={getFieldValue(field.key, 'en')}
                    onChange={(e) => handleFieldChange(field.key, e.target.value, 'en')}
                    placeholder={`Enter ${field.label.toLowerCase()} in English`}
                    className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    rows={4}
                  />
                ) : (
                  <CMSInput
                    value={getFieldValue(field.key, 'en')}
                    onChange={(value) => handleFieldChange(field.key, value, 'en')}
                    placeholder={`Enter ${field.label.toLowerCase()} in English`}
                  />
                )}
              </div>
              
              {/* Spanish */}
              <div>
                <label className="block text-sm font-medium text-[#EAEAEA] mb-2">
                  🇪🇸 Español
                </label>
                {field.key.includes('Content') ? (
                  <textarea
                    value={getFieldValue(field.key, 'es')}
                    onChange={(e) => handleFieldChange(field.key, e.target.value, 'es')}
                    placeholder={`Enter ${field.label.toLowerCase()} in Spanish`}
                    className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    rows={4}
                  />
                ) : (
                  <CMSInput
                    value={getFieldValue(field.key, 'es')}
                    onChange={(value) => handleFieldChange(field.key, value, 'es')}
                    placeholder={`Enter ${field.label.toLowerCase()} in Spanish`}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <div className="bg-[#1A1A2E] p-6 rounded-lg border border-[#2D2D44]">
          <h3 className="text-lg font-semibold text-[#FFD700] mb-4">Translation Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-[#EAEAEA] mb-3">🇺🇸 English Version</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Hero:</strong> {typeof localContent.heroTitleEn === 'string' ? localContent.heroTitleEn || 'Welcome to SOULPATH' : 'Welcome to SOULPATH'}</p>
                <p><strong>Subtitle:</strong> {typeof localContent.heroSubtitleEn === 'string' ? localContent.heroSubtitleEn || 'Your journey to wellness starts here' : 'Your journey to wellness starts here'}</p>
                <p><strong>About:</strong> {typeof localContent.aboutTitleEn === 'string' ? localContent.aboutTitleEn || 'About Us' : 'About Us'}</p>
                <p><strong>Approach:</strong> {typeof localContent.approachTitleEn === 'string' ? localContent.approachTitleEn || 'Our Approach' : 'Our Approach'}</p>
                <p><strong>Services:</strong> {typeof localContent.servicesTitleEn === 'string' ? localContent.servicesTitleEn || 'Our Services' : 'Our Services'}</p>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium text-[#EAEAEA] mb-3">🇪🇸 Spanish Version</h4>
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

      {/* Empty State */}
      {translationFields.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#2D2D44] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-[#9CA3AF]" />
          </div>
          <h3 className="text-lg font-medium text-[#EAEAEA] mb-2">No translations found</h3>
          <p className="text-[#9CA3AF] mb-4">Try adjusting your search terms or clear the search to see all translations.</p>
          <CMSButton
            onClick={() => setSearchTerm('')}
            variant="secondary"
            size="sm"
          >
            Clear Search
          </CMSButton>
        </div>
      )}
    </div>
  );
}
