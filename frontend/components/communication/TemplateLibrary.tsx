'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BaseButton } from '../ui/BaseButton';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  Mail,
  Smartphone,
  Search,
  Filter
} from 'lucide-react';
import { BaseInput } from '../ui/BaseInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TemplateEditor } from './TemplateEditor';
import { TemplatePreview } from './TemplatePreview';

interface Template {
  id: number;
  templateKey: string;
  name: string;
  description?: string;
  type: 'email' | 'sms';
  category?: string;
  isActive: boolean;
  isDefault: boolean;
  translations: TemplateTranslation[];
}

interface TemplateTranslation {
  id: number;
  language: string;
  subject?: string;
  content: string;
}

interface TemplateLibraryProps {
  type: 'email' | 'sms';
}

export function TemplateLibrary({ type }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);



  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/communication/templates?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [type]);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean))) as string[];

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const newTemplate = {
        templateKey: `${template.templateKey}_copy_${Date.now()}`,
        name: `${template.name} (Copy)`,
        description: template.description,
        type: template.type,
        category: template.category,
        translations: template.translations.map(t => ({
          language: t.language,
          subject: t.subject,
          content: t.content
        }))
      };

      const response = await fetch('/api/admin/communication/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        loadTemplates();
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (template.isDefault) {
      alert('Default templates cannot be deleted');
      return;
    }

    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        const response = await fetch(`/api/admin/communication/templates/${template.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          loadTemplates();
        }
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleTemplateSaved = () => {
    setShowEditor(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ffd700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="dashboard-text-secondary">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="dashboard-text-primary text-2xl font-bold">
            {type === 'email' ? 'Email' : 'SMS'} Templates
          </h2>
          <p className="dashboard-text-secondary mt-1">
            Manage your {type} templates and translations
          </p>
        </div>
        <BaseButton
          onClick={handleCreateTemplate}
          className="dashboard-button-primary"
        >
          <Plus size={16} className="mr-2" />
          Create Template
        </BaseButton>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <BaseInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="dashboard-input pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48 dashboard-select">
            <Filter size={16} className="mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="dashboard-dropdown-content">
            <SelectItem value="all" className="dashboard-dropdown-item">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category} className="dashboard-dropdown-item">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="dashboard-card">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="dashboard-card-title text-lg flex items-center gap-2">
                    {type === 'email' ? <Mail size={16} /> : <Smartphone size={16} />}
                    {template.name}
                  </CardTitle>
                  {template.description && (
                    <p className="dashboard-text-secondary text-sm mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {template.isDefault && (
                    <Badge variant="secondary" className="dashboard-badge text-xs">Default</Badge>
                  )}
                  {!template.isActive && (
                    <Badge variant="outline" className="dashboard-badge text-xs">Inactive</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {template.category && (
                  <div>
                    <span className="text-xs text-gray-500">Category:</span>
                    <Badge variant="outline" className="dashboard-badge ml-2 text-xs">
                      {template.category}
                    </Badge>
                  </div>
                )}
                
                <div>
                  <span className="text-xs text-gray-500">Languages:</span>
                  <div className="flex gap-1 mt-1">
                    {template.translations.map(translation => (
                      <Badge key={translation.language} variant="outline" className="dashboard-badge text-xs">
                        {translation.language.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <BaseButton
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreviewTemplate(template)}
                    className="dashboard-button-outline flex-1"
                  >
                    <Eye size={14} className="mr-1" />
                    Preview
                  </BaseButton>
                  <BaseButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditTemplate(template)}
                    className="dashboard-button-outline flex-1"
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </BaseButton>
                </div>

                <div className="flex gap-2">
                  <BaseButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateTemplate(template)}
                    className="dashboard-button-outline flex-1"
                  >
                    <Copy size={14} className="mr-1" />
                    Duplicate
                  </BaseButton>
                  {!template.isDefault && (
                    <BaseButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template)}
                      className="dashboard-button-danger flex-1"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </BaseButton>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {type === 'email' ? <Mail size={48} className="mx-auto" /> : <Smartphone size={48} className="mx-auto" />}
          </div>
          <h3 className="text-lg font-medium dashboard-text-primary mb-2">No templates found</h3>
          <p className="dashboard-text-secondary mb-4">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : `Create your first ${type} template to get started`
            }
          </p>
          {(!searchTerm && selectedCategory === 'all') && (
            <BaseButton
              onClick={handleCreateTemplate}
              className="dashboard-button-primary"
            >
              <Plus size={16} className="mr-2" />
              Create Template
            </BaseButton>
          )}
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <TemplateEditor
          template={editingTemplate}
          type={type}
          onSave={handleTemplateSaved}
          onClose={() => {
            setShowEditor(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Template Preview Modal */}
      {showPreview && previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => {
            setShowPreview(false);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
}
