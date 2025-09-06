'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Move, Edit, Trash2, Plus, Save, X } from 'lucide-react';
import { SectionConfig } from '@/lib/content-config';
import { CMSButton } from './CMSButton';
import { CMSInput } from './CMSInput';
import { useToast } from './Toast';

interface SectionManagerProps {
  sections: SectionConfig[];
  onSectionsChange: (sections: SectionConfig[]) => void;
}

export function SectionManager({ sections, onSectionsChange }: SectionManagerProps) {
  const { showSuccess, showError } = useToast();
  const [localSections, setLocalSections] = useState<SectionConfig[]>(sections);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<SectionConfig>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSection, setNewSection] = useState<Partial<SectionConfig>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSections(sections);
    setHasChanges(false);
  }, [sections]);

  const handleSectionToggle = (sectionId: string) => {
    const updatedSections = localSections.map(section =>
      section.id === sectionId
        ? { ...section, enabled: !section.enabled }
        : section
    );
    setLocalSections(updatedSections);
    setHasChanges(true);
    onSectionsChange(updatedSections);
  };

  const handleSectionReorder = (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = localSections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= localSections.length) return;

    const updatedSections = [...localSections];
    const [movedSection] = updatedSections.splice(currentIndex, 1);
    updatedSections.splice(newIndex, 0, movedSection);

    // Update order numbers
    updatedSections.forEach((section, index) => {
      section.order = index;
    });

    setLocalSections(updatedSections);
    setHasChanges(true);
    onSectionsChange(updatedSections);
  };

  const startEditing = (section: SectionConfig) => {
    setEditingSection(section.id);
    setEditingData({ ...section });
  };

  const saveEditing = () => {
    if (!editingSection) return;

    const updatedSections = localSections.map(section =>
      section.id === editingSection
        ? { ...section, ...editingData }
        : section
    );

    setLocalSections(updatedSections);
    setEditingSection(null);
    setEditingData({});
    setHasChanges(true);
    onSectionsChange(updatedSections);
    showSuccess('Section Updated', 'Section configuration has been updated successfully.', 1500);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditingData({});
  };

  const deleteSection = async (sectionId: string) => {
    if (window.confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      try {
        // Remove from database by updating all sections except the deleted one
        const updatedSections = localSections.filter(section => section.id !== sectionId);
        
        const response = await fetch('/api/admin/sections', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            sections: updatedSections,
            action: 'replace' // Replace all sections with the updated list
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete section');
        }

        // Update local state
        setLocalSections(updatedSections);
        setHasChanges(false); // No unsaved changes since we saved to DB
        onSectionsChange(updatedSections);
        showSuccess('Section Deleted!', 'Section has been removed and saved to database.', 1500);
        
        // Trigger revalidation
        try {
          await fetch('/api/revalidate?path=/&tag=sections', { method: 'POST' });
          console.log('✅ Front page revalidation triggered for section deletion');
        } catch (revalError) {
          console.warn('⚠️ Section revalidation failed:', revalError);
        }
        
      } catch (error) {
        console.error('Error deleting section:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showError('Delete Failed', `Failed to delete section: ${errorMessage}`, 2000);
      }
    }
  };

  const addNewSection = async () => {
    if (!newSection.id || !newSection.title || !newSection.component) {
      showError('Validation Error', 'Please fill in all required fields.', 2000);
      return;
    }

    const section: SectionConfig = {
      id: newSection.id,
      type: newSection.type || 'content',
      title: newSection.title,
      description: newSection.description || '',
      icon: newSection.icon || 'Circle',
      component: newSection.component,
      order: localSections.length,
      enabled: true,
      mobileConfig: {
        padding: 'pt-20 pb-12',
        layout: 'center',
        imageSize: 'medium'
      },
      desktopConfig: {
        padding: 'pt-16 pb-20',
        layout: 'center',
        imageSize: 'medium'
      }
    };

    try {
      // Save the new section to the database immediately
      const response = await fetch('/api/admin/sections', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          sections: [section],
          action: 'add' // Add new section without replacing existing ones
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save new section');
      }

      // Update local state
      const updatedSections = [...localSections, section];
      setLocalSections(updatedSections);
      setShowAddForm(false);
      setNewSection({});
      setHasChanges(false); // No unsaved changes since we saved to DB
      onSectionsChange(updatedSections);
      showSuccess('Section Added!', 'New section has been added and saved to the database.', 2000);
      
      // Trigger revalidation
      try {
        await fetch('/api/revalidate?path=/&tag=sections', { method: 'POST' });
        console.log('✅ Front page revalidation triggered for new section');
      } catch (revalError) {
        console.warn('⚠️ Section revalidation failed:', revalError);
      }
      
    } catch (error) {
      console.error('Error adding section:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError('Add Failed', `Failed to add section: ${errorMessage}`, 2000);
    }
  };

  const saveAllChanges = async () => {
    try {
      const response = await fetch('/api/admin/sections', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          sections: localSections,
          action: 'replace' // Replace all sections when saving all changes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save sections');
      }

      await response.json();
      setHasChanges(false);
      showSuccess('Sections Saved!', 'All section changes have been saved and the page will be revalidated.', 2000);
      
      // Trigger revalidation of the front page
      try {
        await fetch('/api/revalidate?path=/&tag=sections', { method: 'POST' });
        console.log('✅ Front page revalidation triggered for sections');
      } catch (revalError) {
        console.warn('⚠️ Section revalidation failed:', revalError);
        showError('Revalidation Warning', 'Sections saved but page revalidation failed. Changes may take time to appear.', 2000);
      }
      
    } catch (error) {
      console.error('Error saving sections:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError('Save Failed', `Failed to save sections: ${errorMessage}`, 2000);
    }
  };

  const resetChanges = () => {
    setLocalSections(sections);
    setHasChanges(false);
    setEditingSection(null);
    setEditingData({});
    setShowAddForm(false);
    setNewSection({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#1A1A2E] p-4 rounded-lg border border-[#2D2D44]">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-[#EAEAEA] flex items-center">
            <Settings size={20} className="mr-2 text-[#FFD700]" />
            Section Management
          </h2>
          <span className="text-sm text-[#9CA3AF]">
            Manage front page sections and their configuration
          </span>
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
            onClick={saveAllChanges}
            disabled={!hasChanges}
            variant="primary"
            size="sm"
          >
            <Save size={16} className="mr-2" />
            Save All
          </CMSButton>
        </div>
      </div>

      {/* Add New Section */}
      <div className="bg-[#1A1A2E] p-6 rounded-lg border border-[#2D2D44]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#FFD700]">Add New Section</h3>
          <CMSButton
            onClick={() => setShowAddForm(!showAddForm)}
            variant="secondary"
            size="sm"
          >
            {showAddForm ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
            {showAddForm ? 'Cancel' : 'Add Section'}
          </CMSButton>
        </div>

        {showAddForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Section ID *</label>
              <CMSInput
                value={newSection.id || ''}
                onChange={(value) => setNewSection({ ...newSection, id: value })}
                placeholder="unique-section-id"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Title *</label>
              <CMSInput
                value={newSection.title || ''}
                onChange={(value) => setNewSection({ ...newSection, title: value })}
                placeholder="Section Title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Component *</label>
              <select
                value={newSection.component || ''}
                onChange={(e) => setNewSection({ ...newSection, component: e.target.value })}
                className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              >
                <option value="">Select Component</option>
                <option value="HeroSection">Hero Section</option>
                <option value="AboutSection">About Section</option>
                <option value="ApproachSection">Approach Section</option>
                <option value="SessionSection">Session Section</option>
                <option value="BookingSection">Booking Section</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Type</label>
              <select
                value={newSection.type || 'content'}
                onChange={(e) => setNewSection({ ...newSection, type: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              >
                <option value="hero">Hero</option>
                <option value="content">Content</option>
                <option value="form">Form</option>
                <option value="gallery">Gallery</option>
                <option value="testimonial">Testimonial</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Icon</label>
              <CMSInput
                value={newSection.icon || 'Circle'}
                onChange={(value) => setNewSection({ ...newSection, icon: value })}
                placeholder="Icon name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Description</label>
              <CMSInput
                value={newSection.description || ''}
                onChange={(value) => setNewSection({ ...newSection, description: value })}
                placeholder="Section description"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <CMSButton
                onClick={addNewSection}
                variant="primary"
                size="sm"
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Section
              </CMSButton>
            </div>
          </div>
        )}
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {localSections.map((section, index) => (
          <div
            key={section.id}
            className={`bg-[#1A1A2E] p-4 rounded-lg border transition-all duration-200 ${
              section.enabled 
                ? 'border-[#2D2D44] hover:border-[#3D3D54]' 
                : 'border-[#1A1A2E] opacity-60'
            }`}
          >
            {editingSection === section.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Title</label>
                    <CMSInput
                      value={editingData.title || ''}
                      onChange={(value) => setEditingData({ ...editingData, title: value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Component</label>
                    <CMSInput
                      value={editingData.component || ''}
                      onChange={(value) => setEditingData({ ...editingData, component: value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Icon</label>
                    <CMSInput
                      value={editingData.icon || ''}
                      onChange={(value) => setEditingData({ ...editingData, icon: value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Type</label>
                    <select
                      value={editingData.type || 'content'}
                      onChange={(e) => setEditingData({ ...editingData, type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    >
                      <option value="hero">Hero</option>
                      <option value="content">Content</option>
                      <option value="form">Form</option>
                      <option value="gallery">Gallery</option>
                      <option value="testimonial">Testimonial</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#EAEAEA] mb-2">Description</label>
                  <textarea
                    value={editingData.description || ''}
                    onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2D2D44] border border-[#3D3D54] rounded-md text-[#EAEAEA] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <CMSButton
                    onClick={cancelEditing}
                    variant="secondary"
                    size="sm"
                  >
                    <X size={16} className="mr-2" />
                    Cancel
                  </CMSButton>
                  <CMSButton
                    onClick={saveEditing}
                    variant="primary"
                    size="sm"
                  >
                    <Save size={16} className="mr-2" />
                    Save
                  </CMSButton>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSectionReorder(section.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-[#9CA3AF] hover:text-[#FFD700] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Move size={16} className="rotate-90" />
                    </button>
                    <button
                      onClick={() => handleSectionReorder(section.id, 'down')}
                      disabled={index === localSections.length - 1}
                      className="p-1 text-[#9CA3AF] hover:text-[#FFD700] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Move size={16} className="-rotate-90" />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-[#9CA3AF] font-mono">#{section.order}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[#EAEAEA] font-medium">{section.title}</span>
                      <span className="text-[#9CA3AF] text-sm">({section.component})</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSectionToggle(section.id)}
                    className={`p-2 rounded-md transition-colors ${
                      section.enabled
                        ? 'text-[#10B981] hover:bg-[#10B981]/20'
                        : 'text-[#9CA3AF] hover:bg-[#9CA3AF]/20'
                    }`}
                    title={section.enabled ? 'Disable section' : 'Enable section'}
                  >
                    {section.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  
                  <CMSButton
                    onClick={() => startEditing(section)}
                    variant="secondary"
                    size="sm"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </CMSButton>
                  
                  <CMSButton
                    onClick={() => deleteSection(section.id)}
                    variant="secondary"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </CMSButton>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {localSections.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#2D2D44] rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings size={24} className="text-[#9CA3AF]" />
          </div>
          <h3 className="text-lg font-medium text-[#EAEAEA] mb-2">No sections configured</h3>
          <p className="text-[#9CA3AF] mb-4">Start by adding your first section to build your front page.</p>
          <CMSButton
            onClick={() => setShowAddForm(true)}
            variant="primary"
            size="sm"
          >
            <Plus size={16} className="mr-2" />
            Add First Section
          </CMSButton>
        </div>
      )}
    </div>
  );
}
