import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionConfig } from '@/lib/content-config';
import { useContentManagement } from '@/hooks/useContentManagement';
import { Plus, Edit, Eye, EyeOff, GripVertical, X } from 'lucide-react';

interface ContentManagementDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContentManagementDashboard: React.FC<ContentManagementDashboardProps> = ({
  isOpen,
  onClose
}) => {
  const {
    sections,
    addSection,
    updateSectionConfig,
    toggleSectionVisibility,
    reorderSections,
    getSectionById
  } = useContentManagement();

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSection, setNewSection] = useState<Partial<SectionConfig>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSection = () => {
    if (newSection.id && newSection.title && newSection.component) {
      const section: SectionConfig = {
        id: newSection.id,
        type: newSection.type || 'content',
        title: newSection.title,
        description: newSection.description,
        icon: newSection.icon || 'Circle',
        component: newSection.component,
        order: sections.length,
        enabled: true,
        mobileConfig: {
          padding: 'pt-20 pb-12',
          layout: 'stack',
          imageSize: 'medium'
        },
        desktopConfig: {
          padding: 'pt-16 pb-20',
          layout: 'grid',
          imageSize: 'medium'
        }
      };
      
      addSection(section);
      setNewSection({});
      setShowAddForm(false);
    }
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<SectionConfig>) => {
    updateSectionConfig(sectionId, updates);
    setEditingSection(null);
  };

  const handleToggleVisibility = (sectionId: string) => {
    toggleSectionVisibility(sectionId);
  };

  const handleReorder = (sectionId: string, direction: 'up' | 'down') => {
    const section = getSectionById(sectionId);
    if (section) {
      const newOrder = direction === 'up' ? section.order - 1 : section.order + 1;
      if (newOrder >= 0 && newOrder < sections.length) {
        reorderSections(sectionId, newOrder);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1a1a2e] border border-[#16213e] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#16213e] p-6 border-b border-[#16213e]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#FFD700]">Content Management Dashboard</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#0f3460] rounded-lg transition-colors"
            >
              <X size={24} className="text-[#C0C0C0]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Add New Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#FFD700]">Sections</h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-2 bg-[#FFD700] text-[#0A0A23] px-4 py-2 rounded-lg hover:bg-[#FFD700]/90 transition-colors"
              >
                <Plus size={20} />
                <span>Add Section</span>
              </button>
            </div>

            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#0f3460] p-4 rounded-lg mb-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Section ID (e.g., testimonials)"
                    value={newSection.id || ''}
                    onChange={(e) => setNewSection({ ...newSection, id: e.target.value })}
                    className="bg-[#1a1a2e] border border-[#16213e] rounded-lg px-3 py-2 text-[#C0C0C0] placeholder-[#C0C0C0]/50"
                  />
                  <input
                    type="text"
                    placeholder="Section Title"
                    value={newSection.title || ''}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    className="bg-[#1a1a2e] border border-[#16213e] rounded-lg px-3 py-2 text-[#C0C0C0] placeholder-[#C0C0C0]/50"
                  />
                  <select
                    value={newSection.type || 'content'}
                    onChange={(e) => setNewSection({ ...newSection, type: e.target.value as 'hero' | 'content' | 'form' | 'gallery' | 'testimonial' })}
                    className="bg-[#1a1a2e] border border-[#16213e] rounded-lg px-3 py-2 text-[#C0C0C0]"
                  >
                    <option value="hero">Hero</option>
                    <option value="content">Content</option>
                    <option value="form">Form</option>
                    <option value="gallery">Gallery</option>
                    <option value="testimonial">Testimonial</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Component Name (e.g., TestimonialSection)"
                    value={newSection.component || ''}
                    onChange={(e) => setNewSection({ ...newSection, component: e.target.value })}
                    className="bg-[#1a1a2e] border border-[#16213e] rounded-lg px-3 py-2 text-[#C0C0C0] placeholder-[#C0C0C0]/50"
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-[#C0C0C0] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSection}
                    className="px-4 py-2 bg-[#FFD700] text-[#0A0A23] rounded-lg hover:bg-[#FFD700]/90 transition-colors"
                  >
                    Add Section
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sections List */}
          <div className="space-y-4">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#0f3460] border border-[#16213e] rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <GripVertical size={20} className="text-[#C0C0C0]/50 cursor-move" />
                      <span className="text-sm text-[#C0C0C0]/50">#{section.order + 1}</span>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-[#FFD700]">{section.title}</h4>
                      <p className="text-sm text-[#C0C0C0]/70">{section.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-[#C0C0C0]/50">Type: {section.type}</span>
                        <span className="text-xs text-[#C0C0C0]/50">•</span>
                        <span className="text-xs text-[#C0C0C0]/50">Component: {section.component}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Reorder buttons */}
                    <button
                      onClick={() => handleReorder(section.id, 'up')}
                      disabled={index === 0}
                      className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <div className="w-4 h-4 border-t-2 border-l-2 border-[#C0C0C0] transform rotate-45 translate-y-1"></div>
                    </button>
                    <button
                      onClick={() => handleReorder(section.id, 'down')}
                      disabled={index === sections.length - 1}
                      className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <div className="w-4 h-4 border-t-2 border-l-2 border-[#C0C0C0] transform rotate-45 translate-y-1 translate-x-1"></div>
                    </button>

                    {/* Toggle visibility */}
                    <button
                      onClick={() => handleToggleVisibility(section.id)}
                      className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
                      title={section.enabled ? 'Hide section' : 'Show section'}
                    >
                      {section.enabled ? (
                        <Eye size={20} className="text-[#4ade80]" />
                      ) : (
                        <EyeOff size={20} className="text-[#f87171]" />
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                      className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
                      title="Edit section"
                    >
                      <Edit size={20} className="text-[#C0C0C0]" />
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {editingSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-[#16213e]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Title"
                        value={section.title}
                        onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                        className="bg-[#1a1a2e] border border-[#16213e] rounded-lg px-3 py-2 text-[#C0C0C0]"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={section.description || ''}
                        onChange={(e) => handleUpdateSection(section.id, { description: e.target.value })}
                        className="bg-[#1a1a2e] border border-[#16213e] rounded-lg px-3 py-2 text-[#C0C0C0]"
                      />
                      <select
                        value={section.type}
                        onChange={(e) => handleUpdateSection(section.id, { type: e.target.value as 'hero' | 'content' | 'form' | 'gallery' | 'testimonial' })}
                        className="bg-[#1a1a2e] border border-[#16213e] rounded-lg px-3 py-2 text-[#C0C0C0]"
                      >
                        <option value="hero">Hero</option>
                        <option value="content">Content</option>
                        <option value="form">Form</option>
                        <option value="gallery">Gallery</option>
                        <option value="testimonial">Testimonial</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Icon name"
                        value={section.icon}
                        onChange={(e) => handleUpdateSection(section.id, { icon: e.target.value })}
                        className="bg-[#1a1a2e] border border-[#16213e] rounded-lg px-3 py-2 text-[#C0C0C0]"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ContentManagementDashboard;
