export interface SectionConfig {
  id: string;
  type: 'hero' | 'content' | 'form' | 'gallery' | 'testimonial';
  title: string;
  description?: string;
  icon: string;
  component: string;
  order: number;
  enabled: boolean;
  mobileConfig?: {
    padding?: string;
    layout?: 'stack' | 'grid' | 'center';
    imageSize?: 'small' | 'medium' | 'large';
  };
  desktopConfig?: {
    padding?: string;
    layout?: 'stack' | 'grid' | 'center';
    imageSize?: 'small' | 'medium' | 'large';
  };
}

export interface ContentSection {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  image?: string;
  imageAlt?: string;
  ctaText?: string;
  ctaAction?: string;
  order: number;
  enabled: boolean;
}

export const DEFAULT_SECTIONS: SectionConfig[] = [
  {
    id: 'invitation',
    type: 'hero',
    title: 'Invitation',
    description: 'Main landing section with cosmic theme',
    icon: 'Star',
    component: 'HeroSection',
    order: 0,
    enabled: true,
    mobileConfig: {
      padding: 'pt-20 pb-12',
      layout: 'center',
      imageSize: 'large'
    },
    desktopConfig: {
      padding: 'pt-16 pb-20',
      layout: 'center',
      imageSize: 'large'
    }
  },
  {
    id: 'approach',
    type: 'content',
    title: 'Our Approach',
    description: 'How we work and our methodology',
    icon: 'Compass',
    component: 'ApproachSection',
    order: 1,
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
  },
  {
    id: 'session',
    type: 'content',
    title: 'Sessions & Services',
    description: 'Available services and session types',
    icon: 'Clock',
    component: 'SessionSection',
    order: 2,
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
  },
  {
    id: 'about',
    type: 'content',
    title: 'About SoulPath',
    description: 'Information about José and SoulPath',
    icon: 'User',
    component: 'AboutSection',
    order: 3,
    enabled: true,
    mobileConfig: {
      padding: 'pt-20 pb-12',
      layout: 'stack',
      imageSize: 'large'
    },
    desktopConfig: {
      padding: 'pt-16 pb-20',
      layout: 'grid',
      imageSize: 'large'
    }
  },
  {
    id: 'apply',
    type: 'form',
    title: 'Book Your Session',
    description: 'Booking form and scheduling',
    icon: 'Calendar',
    component: 'BookingSection',
    order: 4,
    enabled: true,
    mobileConfig: {
      padding: 'pt-20 pb-12',
      layout: 'center',
      imageSize: 'small'
    },
    desktopConfig: {
      padding: 'pt-16 pb-20',
      layout: 'center',
      imageSize: 'small'
    }
  }
];

export const getSectionConfig = (sectionId: string): SectionConfig | undefined => {
  return DEFAULT_SECTIONS.find(section => section.id === sectionId);
};

export const getEnabledSections = (): SectionConfig[] => {
  return DEFAULT_SECTIONS.filter(section => section.enabled).sort((a, b) => a.order - b.order);
};

export const addNewSection = (section: SectionConfig): void => {
  DEFAULT_SECTIONS.push(section);
  DEFAULT_SECTIONS.sort((a, b) => a.order - b.order);
};

export const updateSection = (sectionId: string, updates: Partial<SectionConfig>): void => {
  const index = DEFAULT_SECTIONS.findIndex(section => section.id === sectionId);
  if (index !== -1) {
    DEFAULT_SECTIONS[index] = { ...DEFAULT_SECTIONS[index], ...updates };
  }
};

export const toggleSection = (sectionId: string): void => {
  const section = DEFAULT_SECTIONS.find(section => section.id === sectionId);
  if (section) {
    section.enabled = !section.enabled;
  }
};

export const reorderSections = (sectionId: string, newOrder: number): void => {
  const index = DEFAULT_SECTIONS.findIndex(section => section.id === sectionId);
  if (index !== -1) {
    DEFAULT_SECTIONS[index] = { ...DEFAULT_SECTIONS[index], order: newOrder };
  }
};
