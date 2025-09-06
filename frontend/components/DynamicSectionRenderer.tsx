import React from 'react';
import { motion } from 'framer-motion';
import { SectionConfig } from '@/lib/content-config';
import { HeroSection } from './HeroSection';
import { ApproachSection } from './ApproachSection';
import { SessionSection } from './SessionSection';
import { AboutSection } from './AboutSection';
import { BookingSection } from './BookingSection';

interface DynamicSectionRendererProps {
  section: SectionConfig;
  t: Record<string, string | Record<string, string>>;
  language: string;
  scrollToSection: (section: string) => void;
}

const DynamicSectionRenderer: React.FC<DynamicSectionRendererProps> = ({
  section,
  t,
  language,
  scrollToSection
}) => {
  // Get responsive configuration based on screen size
  const getResponsiveConfig = () => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      return isMobile ? section.mobileConfig : section.desktopConfig;
    }
    return section.desktopConfig;
  };

  const config = getResponsiveConfig();
  const padding = config?.padding || 'pt-20 sm:pt-24 lg:pt-28 pb-12';
  const layout = config?.layout || 'center';

  // Base section wrapper with responsive classes
  const getSectionWrapperClasses = () => {
    const baseClasses = `h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 ${padding} overflow-hidden safe-padding`;
    
    switch (layout) {
      case 'stack':
        return `${baseClasses} items-center text-center`;
      case 'grid':
        return `${baseClasses} items-center`;
      case 'center':
        return `${baseClasses} items-center text-center`;
      default:
        return baseClasses;
    }
  };

  // Render the appropriate component based on section type
  const renderSection = () => {
    switch (section.component) {
      case 'HeroSection':
        return <HeroSection t={t} />;
      case 'ApproachSection':
        return <ApproachSection t={t} />;
      case 'SessionSection':
        return <SessionSection t={t} scrollToSection={scrollToSection} />;
      case 'AboutSection':
        return <AboutSection t={t} />;
      case 'BookingSection':
        return <BookingSection t={t} language={language} />;
      default:
        return (
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FFD700] mb-4">
              {section.title}
            </h2>
            <p className="text-[#C0C0C0] text-lg">
              {section.description || 'Section content coming soon...'}
            </p>
          </div>
        );
    }
  };

  return (
    <motion.section
      key={section.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.4, 0.0, 0.2, 1],
        scale: { duration: 0.4 }
      }}
      className={getSectionWrapperClasses()}
    >
      {renderSection()}
    </motion.section>
  );
};

export default DynamicSectionRenderer;
