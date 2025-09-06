import { useState, useEffect, useCallback } from 'react';
import { SectionConfig, getEnabledSections, addNewSection, updateSection, toggleSection } from '@/lib/content-config';

export interface ContentManager {
  sections: SectionConfig[];
  currentSection: number;
  totalSections: number;
  addSection: (section: SectionConfig) => void;
  updateSectionConfig: (sectionId: string, updates: Partial<SectionConfig>) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  reorderSections: (sectionId: string, newOrder: number) => void;
  getSectionById: (sectionId: string) => SectionConfig | undefined;
  getNextSection: () => SectionConfig | undefined;
  getPreviousSection: () => SectionConfig | undefined;
}

export const useContentManagement = (): ContentManager => {
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [currentSection] = useState(0);

  // Initialize sections from database
  useEffect(() => {
    const loadSectionsFromDB = async () => {
      try {
        const response = await fetch('/api/sections');
        
        if (response.ok) {
          const data = await response.json();
          if (data.sections && Array.isArray(data.sections)) {
            setSections(data.sections);
            console.log('✅ Sections loaded from database in hook:', data.sections.length);
          } else {
            console.warn('⚠️ No sections data in hook, using defaults');
            const enabledSections = getEnabledSections();
            setSections(enabledSections);
          }
        } else {
          console.warn('⚠️ Failed to load sections in hook, using defaults');
          const enabledSections = getEnabledSections();
          setSections(enabledSections);
        }
      } catch (error) {
        console.error('Error loading sections in hook:', error);
        const enabledSections = getEnabledSections();
        setSections(enabledSections);
      }
    };

    loadSectionsFromDB();
  }, []);

  // Add new section
  const addSection = useCallback((section: SectionConfig) => {
    addNewSection(section);
    const updatedSections = getEnabledSections();
    setSections(updatedSections);
  }, []);

  // Update section configuration
  const updateSectionConfig = useCallback((sectionId: string, updates: Partial<SectionConfig>) => {
    updateSection(sectionId, updates);
    const updatedSections = getEnabledSections();
    setSections(updatedSections);
  }, []);

  // Toggle section visibility
  const toggleSectionVisibility = useCallback((sectionId: string) => {
    toggleSection(sectionId);
    const updatedSections = getEnabledSections();
    setSections(updatedSections);
  }, []);

  // Reorder sections
  const reorderSections = useCallback((sectionId: string, newOrder: number) => {
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, order: newOrder };
      }
      return section;
    });
    
    // Sort by new order
    updatedSections.sort((a, b) => a.order - b.order);
    
    // Update all sections with new order
    updatedSections.forEach((section, index) => {
      updateSection(section.id, { order: index });
    });
    
    const finalSections = getEnabledSections();
    setSections(finalSections);
  }, [sections]);

  // Get section by ID
  const getSectionById = useCallback((sectionId: string) => {
    return sections.find(section => section.id === sectionId);
  }, [sections]);

  // Get next section
  const getNextSection = useCallback(() => {
    if (currentSection < sections.length - 1) {
      return sections[currentSection + 1];
    }
    return undefined;
  }, [currentSection, sections]);

  // Get previous section
  const getPreviousSection = useCallback(() => {
    if (currentSection > 0) {
      return sections[currentSection - 1];
    }
    return undefined;
  }, [currentSection, sections]);

  return {
    sections,
    currentSection,
    totalSections: sections.length,
    addSection,
    updateSectionConfig,
    toggleSectionVisibility,
    reorderSections,
    getSectionById,
    getNextSection,
    getPreviousSection,
  };
};
