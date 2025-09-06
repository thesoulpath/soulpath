'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BaseButton } from '../ui/BaseButton';
import { BaseInput } from '../ui/BaseInput';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Badge } from '../ui/badge';
import { 
  Save, 
  X, 
  Eye, 
  Plus,
  AlertCircle
} from 'lucide-react';
import { getPlaceholdersGrouped, validatePlaceholders } from '../../lib/communication/placeholders';

interface Template {
  id?: number;
  templateKey: string;
  name: string;
  description?: string;
  type: 'email' | 'sms';
  category?: string;
  translations: TemplateTranslation[];
}

interface TemplateTranslation {
  id?: number;
  language: string;
  subject?: string;
  content: string;
}

interface TemplateEditorProps {
  template?: Template | null;
  type: 'email' | 'sms';
  onSave: () => void;
  onClose: () => void;
}

const TEMPLATE_CATEGORIES = [
  'booking',
  'verification',
  'reminder',
  'notification',
  'marketing',
  'support'
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' }
];

export function TemplateEditor({ template, type, onSave, onClose }: TemplateEditorProps) {
  const [formData, setFormData] = useState({
    templateKey: '',
    name: '',
    description: '',
    category: ''
  });

  const [translations, setTranslations] = useState<TemplateTranslation[]>([
    { language: 'en', subject: '', content: '' },
    { language: 'es', subject: '', content: '' }
  ]);

  const [activeLanguage, setActiveLanguage] = useState('en');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [placeholderSearch, setPlaceholderSearch] = useState<string>('');

  useEffect(() => {
    if (template) {
      setFormData({
        templateKey: template.templateKey,
        name: template.name,
        description: template.description || '',
        category: template.category || ''
      });
      setTranslations(template.translations);
    } else {
      // Generate template key from name for new templates
      const key = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      setFormData(prev => ({ ...prev, templateKey: key }));
    }
  }, [template, formData.name]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'name' && !template) {
      const key = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
      setFormData(prev => ({ ...prev, templateKey: key }));
    }
  };

  const handleTranslationChange = (language: string, field: string, value: string) => {
    setTranslations(prev => prev.map(t => 
      t.language === language ? { ...t, [field]: value } : t
    ));
  };

  const insertPlaceholderAtCursor = (placeholder: string) => {
    const currentContent = translations.find(t => t.language === activeLanguage)?.content || '';
    const newContent = currentContent + placeholder;
    handleTranslationChange(activeLanguage, 'content', newContent);
  };

  const validateTemplate = (): boolean => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Template name is required');
    }

    if (!formData.templateKey.trim()) {
      errors.push('Template key is required');
    }

    if (translations.length === 0) {
      errors.push('At least one translation is required');
    }

    translations.forEach(translation => {
      if (!translation.content.trim()) {
        errors.push(`Content for ${translation.language.toUpperCase()} is required`);
      }

      if (type === 'email' && !translation.subject?.trim()) {
        errors.push(`Subject for ${translation.language.toUpperCase()} is required`);
      }

      const validation = validatePlaceholders(translation.content, type);
      if (!validation.valid) {
        errors.push(`Invalid placeholders in ${translation.language.toUpperCase()}: ${validation.missing.join(', ')}`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateTemplate()) {
      return;
    }

    setIsSaving(true);
    try {
      const templateData = {
        templateKey: formData.templateKey,
        name: formData.name,
        description: formData.description,
        type,
        category: formData.category,
        translations: translations.filter(t => t.content.trim())
      };

      const url = template 
        ? `/api/admin/communication/templates/${template.id}`
        : '/api/admin/communication/templates';
      
      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        setValidationErrors([errorData.error || 'Failed to save template']);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setValidationErrors(['Failed to save template']);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTranslation = translations.find(t => t.language === activeLanguage);
  const allPlaceholders = getPlaceholdersGrouped(type);
  
  // Filter placeholders based on search
  const filteredPlaceholders = Object.entries(allPlaceholders).reduce((acc, [category, placeholderList]) => {
    const filtered = placeholderList.filter(placeholder => 
      placeholder.key.toLowerCase().includes(placeholderSearch.toLowerCase()) ||
      placeholder.description.toLowerCase().includes(placeholderSearch.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0A23] rounded-lg border border-[#C0C0C0]/20 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#C0C0C0]/20">
          <CardTitle className="dashboard-text-primary text-xl">
            {template ? 'Edit Template' : 'Create New Template'}
          </CardTitle>
          <div className="flex gap-2">
            <BaseButton
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="dashboard-button-outline"
            >
              <Eye size={16} className="mr-2" />
              Preview
            </BaseButton>
            <BaseButton
              onClick={handleSave}
              disabled={isSaving}
              className="dashboard-button-primary"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Save Template
            </BaseButton>
            <BaseButton
              variant="outline"
              onClick={onClose}
              className="dashboard-button-outline"
            >
              <X size={16} />
            </BaseButton>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-red-400" />
                <span className="text-red-400 font-medium">Validation Errors</span>
              </div>
              <ul className="text-red-400 text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Settings */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-[#0A0A23]/50 border-[#C0C0C0]/20">
                <CardHeader>
                  <CardTitle className="dashboard-card-title text-lg">Template Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="dashboard-label">Template Name</Label>
                    <BaseInput
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter template name"
                      className="dashboard-input"
                    />
                  </div>

                  <div>
                    <Label className="dashboard-label">Template Key</Label>
                    <BaseInput
                      value={formData.templateKey}
                      onChange={(e) => handleInputChange('templateKey', e.target.value)}
                      placeholder="template_key"
                      className="dashboard-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used to reference this template in code
                    </p>
                  </div>

                  <div>
                    <Label className="dashboard-label">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="dashboard-select">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="dashboard-dropdown-content">
                        {TEMPLATE_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category} className="dashboard-dropdown-item">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="dashboard-label">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe when this template is used"
                      className="dashboard-input"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Placeholders */}
              <Card className="bg-[#0A0A23]/50 border-[#C0C0C0]/20">
                <CardHeader>
                  <CardTitle className="dashboard-card-title text-lg">Available Placeholders</CardTitle>
                  <p className="text-xs text-gray-400">
                    Click to insert placeholder into {activeLanguage.toUpperCase()} content
                  </p>
                  <div className="mt-2">
                    <BaseInput
                      value={placeholderSearch}
                      onChange={(e) => setPlaceholderSearch(e.target.value)}
                      placeholder="Search placeholders..."
                      className="dashboard-input text-sm"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.keys(filteredPlaceholders).length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm">No placeholders found matching your search.</p>
                    </div>
                  ) : (
                    Object.entries(filteredPlaceholders).map(([category, placeholderList]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-[#EAEAEA] mb-2 capitalize flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#6366F1] rounded-full"></span>
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {placeholderList.map(placeholder => (
                          <div
                            key={placeholder.key}
                            className="group flex items-center justify-between p-2 bg-[#0A0A23]/30 rounded border border-[#C0C0C0]/10 hover:border-[#6366F1]/50 transition-colors cursor-pointer"
                            onClick={() => insertPlaceholderAtCursor(placeholder.key)}
                          >
                            <div className="flex-1">
                              <code className="text-xs text-[#EAEAEA] font-mono bg-[#0A0A23]/50 px-1 py-0.5 rounded">
                                {placeholder.key}
                              </code>
                              <p className="text-xs text-gray-400 mt-1">{placeholder.description}</p>
                              {placeholder.example && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  Example: {placeholder.example}
                                </p>
                              )}
                            </div>
                            <BaseButton
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                insertPlaceholderAtCursor(placeholder.key);
                              }}
                              className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus size={12} />
                            </BaseButton>
                          </div>
                        ))}
                      </div>
                    </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Content Editor */}
            <div className="lg:col-span-2">
              <Card className="bg-[#0A0A23]/50 border-[#C0C0C0]/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="dashboard-card-title text-lg">Content Editor</CardTitle>
                    <div className="flex gap-2">
                      {LANGUAGES.map(lang => (
                        <BaseButton
                          key={lang.code}
                          size="sm"
                          variant={activeLanguage === lang.code ? "primary" : "outline"}
                          onClick={() => setActiveLanguage(lang.code)}
                          className={activeLanguage === lang.code ? "bg-[#6366F1] text-white" : "text-[#EAEAEA] border-[#C0C0C0]/30"}
                        >
                          {lang.name}
                        </BaseButton>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {type === 'email' && (
                    <div>
                      <Label className="dashboard-label">Subject ({activeLanguage.toUpperCase()})</Label>
                      <BaseInput
                        value={currentTranslation?.subject || ''}
                        onChange={(e) => handleTranslationChange(activeLanguage, 'subject', e.target.value)}
                        placeholder="Enter email subject"
                        className="dashboard-input"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="dashboard-label">
                      Content ({activeLanguage.toUpperCase()}) 
                      {type === 'email' ? ' - HTML' : ' - Plain Text'}
                    </Label>
                    <Textarea
                      value={currentTranslation?.content || ''}
                      onChange={(e) => handleTranslationChange(activeLanguage, 'content', e.target.value)}
                      placeholder={type === 'email' 
                        ? 'Enter HTML content...' 
                        : 'Enter plain text content...'
                      }
                      className="dashboard-input font-mono"
                      rows={12}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {type === 'email' 
                        ? 'Use HTML tags for formatting. Placeholders will be replaced with actual data.'
                        : 'Plain text only. Placeholders will be replaced with actual data.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
