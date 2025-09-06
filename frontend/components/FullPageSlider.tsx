'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Play, Pause, Settings, X, Edit3, Save, Trash2, Eye, EyeOff } from 'lucide-react';

// Types
interface SectionData {
  id: string;
  title: string;
  content?: string;
  backgroundVideo?: VideoConfig;
  backgroundImage?: string;
  backgroundColor?: string;
  verticalSlides?: VerticalSlide[];
  isVisible?: boolean;
}

interface VerticalSlide {
  id: string;
  title: string;
  content: string;
  backgroundColor?: string;
}

interface VideoConfig {
  src: string;
  poster?: string;
  fallback?: {
    image?: string;
    color?: string;
  };
  options?: {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
  };
}

interface HeaderConfig {
  show: boolean;
  transparent: boolean;
  blur: boolean;
  title: string;
}

interface NavigationConfig {
  show: boolean;
  position: 'left' | 'right';
  type: 'dots' | 'numbers';
}

// Custom hooks (currently unused but available for future enhancements)
// const useKeyboardNavigation = (
//   nextSlide: () => void,
//   prevSlide: () => void,
//   handleVerticalNavigation: (direction: 'up' | 'down') => void,
//   isTransitioning: boolean
// ) => {
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (isTransitioning) return;

//       // Prevent navigation if user is editing content
//       if (e.target && (e.target as HTMLElement).contentEditable === 'true') return;

//       switch (e.key) {
//         case 'ArrowLeft':
//         case 'PageUp':
//           e.preventDefault();
//           prevSlide();
//           break;
//         case 'ArrowRight':
//         case 'PageDown':
//           e.preventDefault();
//           nextSlide();
//           break;
//         case 'ArrowUp':
//           e.preventDefault();
//           handleVerticalNavigation('up');
//           break;
//         case 'ArrowDown':
//           e.preventDefault();
//           handleVerticalNavigation('down');
//           break;
//         case 'Home':
//           e.preventDefault();
//           // Go to first slide - will be implemented in parent
//           break;
//         case 'End':
//           e.preventDefault();
//           // Go to last slide - will be implemented in parent
//           break;
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [nextSlide, prevSlide, handleVerticalNavigation, isTransitioning]);
// };

// const useIntersectionObserver = (callback: (entries: IntersectionObserverEntry[]) => void) => {
//   const observer = useRef<IntersectionObserver | null>(null);

//   useEffect(() => {
//     observer.current = new IntersectionObserver(callback, {
//       threshold: 0.5,
//       rootMargin: '0px'
//     });

//     return () => {
//       if (observer.current) {
//         observer.current.disconnect();
//       }
//     };
//   }, [callback]);

//   const observe = useCallback((element: Element) => {
//     if (observer.current) {
//       observer.current.observe(element);
//     }
//   }, []);

//   const unobserve = useCallback((element: Element) => {
//     if (observer.current) {
//       observer.current.unobserve(element);
//     }
//   }, []);

//   return { observe, unobserve };
// };

// Video Background Component - Optimized
const VideoBackground = React.memo(({ config }: { config: VideoConfig }) => {
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => setVideoError(true));
      }
    }
  }, [isPlaying]);

  const handleLoadStart = () => setIsLoading(true);
  const handleCanPlay = () => setIsLoading(false);
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleError = () => {
    setVideoError(true);
    setIsLoading(false);
  };

  if (videoError || !config.src) {
    return (
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: config.fallback?.image ? `url(${config.fallback.image})` : 'none',
          backgroundColor: config.fallback?.color || '#1f2937'
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay={config.options?.autoplay ?? true}
        loop={config.options?.loop ?? true}
        muted={config.options?.muted ?? true}
        poster={config.poster}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        preload="metadata"
        playsInline
      >
        <source src={config.src} type="video/mp4" />
      </video>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      <button
        onClick={togglePlay}
        className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
});

VideoBackground.displayName = 'VideoBackground';

// Header Component - Enhanced
const Header = React.memo(({ config, currentSlide, totalSlides, onSlideClick }: {
  config: HeaderConfig;
  currentSlide: number;
  totalSlides: number;
  onSlideClick: (index: number) => void;
}) => {
  if (!config.show) return null;

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50 p-4
      ${config.transparent ? 'bg-transparent' : 'bg-white/90'}
      ${config.blur ? 'backdrop-blur-sm' : ''}
      transition-all duration-300
    `}>
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-white drop-shadow-lg">
          {config.title}
        </h1>
        
        <nav className="flex space-x-2" role="navigation" aria-label="Slide navigation">
          {Array.from({ length: totalSlides }, (_, i) => (
            <button
              key={i}
              onClick={() => onSlideClick(i)}
              className={`
                px-3 py-1 rounded text-sm font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-white/50
                ${currentSlide === i 
                  ? 'bg-white text-gray-900' 
                  : 'text-white hover:bg-white/20'
                }
              `}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={currentSlide === i ? 'page' : undefined}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

// Navigation Component - Enhanced
const Navigation = React.memo(({ config, currentSlide, totalSlides, onNavigate }: {
  config: NavigationConfig;
  currentSlide: number;
  totalSlides: number;
  onNavigate: (index: number) => void;
}) => {
  if (!config.show) return null;

  return (
    <nav className={`
      fixed ${config.position === 'right' ? 'right-6' : 'left-6'} 
      top-1/2 transform -translate-y-1/2 z-40
      flex flex-col space-y-3
    `} role="navigation" aria-label="Page navigation">
      {Array.from({ length: totalSlides }, (_, i) => (
        <button
          key={i}
          onClick={() => onNavigate(i)}
          className={`
            transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50
            ${config.type === 'dots' 
              ? `w-3 h-3 rounded-full border-2 border-white
                 ${currentSlide === i ? 'bg-white' : 'bg-transparent'}`
              : `w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 
                 flex items-center justify-center text-white text-sm font-medium
                 ${currentSlide === i ? 'bg-white text-gray-900' : ''}`
            }
          `}
          aria-label={`Go to slide ${i + 1}`}
          aria-current={currentSlide === i ? 'page' : undefined}
        >
          {config.type === 'numbers' && (i + 1)}
        </button>
      ))}
    </nav>
  );
});

Navigation.displayName = 'Navigation';

// Content Editor Component
const ContentEditor = ({ content, onSave, onCancel }: {
  content: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
}) => {
  const [editContent, setEditContent] = useState(content);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Content</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-64 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your content..."
          />
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editContent)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Slide Management Panel
const SlideManagementPanel = ({ 
  sections, 
  setSections, 
  currentSlide, 
  currentVerticalSlide,
  setCurrentVerticalSlide,
  goToSlide
}: {
  sections: SectionData[];
  setSections: React.Dispatch<React.SetStateAction<SectionData[]>>;
  currentSlide: number;
  currentVerticalSlide: number;
  setCurrentVerticalSlide: React.Dispatch<React.SetStateAction<number>>;
  goToSlide: (index: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'horizontal' | 'vertical'>('horizontal');
  const [editingContent, setEditingContent] = useState<{ type: 'main' | 'vertical', index?: number } | null>(null);

  const addHorizontalSlide = () => {
    const newSlide: SectionData = {
      id: `slide-${Date.now()}`,
      title: `New Slide ${sections.length + 1}`,
      content: 'This is a new slide. Click to edit content.',
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      verticalSlides: [],
      isVisible: true
    };
    setSections([...sections, newSlide]);
  };

  const deleteHorizontalSlide = (index: number) => {
    if (sections.length > 1) {
      const newSections = sections.filter((_, i) => i !== index);
      setSections(newSections);
      if (currentSlide >= index && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    }
  };

  const toggleSlideVisibility = (index: number) => {
    const updatedSections = sections.map((section, i) => 
      i === index ? { ...section, isVisible: !section.isVisible } : section
    );
    setSections(updatedSections);
  };

  const updateSlideContent = (content: string) => {
    if (editingContent?.type === 'main') {
      const updatedSections = [...sections];
      updatedSections[currentSlide] = { ...updatedSections[currentSlide], content };
      setSections(updatedSections);
    } else if (editingContent?.type === 'vertical' && editingContent.index !== undefined) {
      const updatedSections = [...sections];
      const currentSection = updatedSections[currentSlide];
      if (currentSection.verticalSlides) {
        currentSection.verticalSlides[editingContent.index] = {
          ...currentSection.verticalSlides[editingContent.index],
          content
        };
      }
      setSections(updatedSections);
    }
    setEditingContent(null);
  };

  const addVerticalSlide = () => {
    const currentSection = sections[currentSlide];
    if (!currentSection) return;

    const newVerticalSlide: VerticalSlide = {
      id: `vertical-${Date.now()}`,
      title: `Vertical Slide ${(currentSection.verticalSlides?.length || 0) + 1}`,
      content: 'This is a new vertical slide.',
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
    };

    const updatedSections = [...sections];
    updatedSections[currentSlide] = {
      ...currentSection,
      verticalSlides: [...(currentSection.verticalSlides || []), newVerticalSlide]
    };
    setSections(updatedSections);
  };

  const deleteVerticalSlide = (verticalIndex: number) => {
    const currentSection = sections[currentSlide];
    if (!currentSection?.verticalSlides) return;

    const updatedSections = [...sections];
    updatedSections[currentSlide] = {
      ...currentSection,
      verticalSlides: currentSection.verticalSlides.filter((_, i) => i !== verticalIndex)
    };
    setSections(updatedSections);
    
    if (currentVerticalSlide >= verticalIndex && currentVerticalSlide > 0) {
      setCurrentVerticalSlide(currentVerticalSlide - 1);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Open slide management"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Slide Management</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('horizontal')}
                className={`flex-1 p-3 text-sm font-medium ${
                  activeTab === 'horizontal' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Horizontal Slides
              </button>
              <button
                onClick={() => setActiveTab('vertical')}
                className={`flex-1 p-3 text-sm font-medium ${
                  activeTab === 'vertical' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Vertical Slides
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-96">
              {activeTab === 'horizontal' && (
                <div className="space-y-3">
                  <button
                    onClick={addHorizontalSlide}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Plus size={16} />
                    Add Horizontal Slide
                  </button>
                  
                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      className={`p-3 border rounded-lg ${
                        currentSlide === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{section.title}</h4>
                          <p className="text-sm text-gray-500">
                            {section.verticalSlides?.length || 0} vertical slides
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleSlideVisibility(index)}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            title={section.isVisible ? 'Hide slide' : 'Show slide'}
                          >
                            {section.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            onClick={() => setEditingContent({ type: 'main' })}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                            title="Edit content"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => deleteHorizontalSlide(index)}
                            disabled={sections.length <= 1}
                            className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete slide"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'vertical' && (
                <div className="space-y-3">
                  <button
                    onClick={addVerticalSlide}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <Plus size={16} />
                    Add Vertical Slide
                  </button>
                  
                  {sections[currentSlide]?.verticalSlides?.map((verticalSlide, index) => (
                    <div
                      key={verticalSlide.id}
                      className={`p-3 border rounded-lg ${
                        currentVerticalSlide === index ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{verticalSlide.title}</h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingContent({ type: 'vertical', index })}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                            title="Edit content"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => deleteVerticalSlide(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Delete vertical slide"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">
                      No vertical slides in current horizontal slide
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingContent && (
        <ContentEditor
          content={
            editingContent.type === 'main' 
              ? sections[currentSlide]?.content || ''
              : sections[currentSlide]?.verticalSlides?.[editingContent.index!]?.content || ''
          }
          onSave={updateSlideContent}
          onCancel={() => setEditingContent(null)}
        />
      )}
    </>
  );
};

// Main FullPage Scroller Component
const FullPageSlider = () => {
  const [sections, setSections] = useState<SectionData[]>([
    {
      id: 'hero',
      title: 'Hero Section',
      content: 'Welcome to our amazing fullpage scroller! This content can scroll vertically within this slide.',
      backgroundVideo: {
        src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        poster: 'https://picsum.photos/1920/1080?random=1',
        fallback: {
          image: 'https://picsum.photos/1920/1080?random=1',
          color: '#1f2937'
        },
        options: { autoplay: true, loop: true, muted: true }
      },
      verticalSlides: [
        {
          id: 'hero-sub1',
          title: 'Hero Subsection 1',
          content: 'This is the first vertical slide within the hero section.',
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        },
        {
          id: 'hero-sub2',
          title: 'Hero Subsection 2',
          content: 'This is the second vertical slide within the hero section.',
          backgroundColor: 'rgba(16, 185, 129, 0.8)'
        }
      ],
      isVisible: true
    },
    {
      id: 'about',
      title: 'About Section',
      content: 'Learn more about us in this section. This slide has a background image.',
      backgroundImage: 'https://picsum.photos/1920/1080?random=2',
      verticalSlides: [],
      isVisible: true
    },
    {
      id: 'services',
      title: 'Services Section',
      content: 'Our services are amazing! This slide has a solid background color.',
      backgroundColor: '#7c3aed',
      verticalSlides: [
        {
          id: 'services-sub1',
          title: 'Service Category 1',
          content: 'Details about our first service category.',
          backgroundColor: 'rgba(239, 68, 68, 0.8)'
        }
      ],
      isVisible: true
    }
  ]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentVerticalSlide, setCurrentVerticalSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const slideRefs = useRef<{ [key: string]: number }>({});
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const visibleSections = useMemo(() => 
    sections.filter(section => section.isVisible !== false), 
    [sections]
  );

  const headerConfig: HeaderConfig = {
    show: true,
    transparent: true,
    blur: true,
    title: 'Enhanced FullPage Scroller'
  };

  const navigationConfig: NavigationConfig = {
    show: true,
    position: 'right',
    type: 'dots'
  };

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < visibleSections.length && index !== currentSlide && !isTransitioning) {
      // Store current vertical scroll position
      const currentSectionId = visibleSections[currentSlide]?.id;
      if (currentSectionId) {
        const slideElement = document.querySelector(`[data-slide-id="${currentSectionId}"]`);
        if (slideElement) {
          slideRefs.current[currentSectionId] = slideElement.scrollTop;
        }
      }

      setIsTransitioning(true);
      setCurrentSlide(index);
      setCurrentVerticalSlide(0);
      
      setTimeout(() => {
        setIsTransitioning(false);
        
        // Restore vertical scroll position
        const newSectionId = visibleSections[index]?.id;
        if (newSectionId && slideRefs.current[newSectionId] !== undefined) {
          const slideElement = document.querySelector(`[data-slide-id="${newSectionId}"]`);
          if (slideElement) {
            slideElement.scrollTop = slideRefs.current[newSectionId];
          }
        }
      }, 600);
    }
  }, [currentSlide, visibleSections, isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % visibleSections.length);
  }, [currentSlide, visibleSections.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide === 0 ? visibleSections.length - 1 : currentSlide - 1);
  }, [currentSlide, visibleSections.length, goToSlide]);

  const goToFirstSlide = useCallback(() => {
    goToSlide(0);
  }, [goToSlide]);

  const goToLastSlide = useCallback(() => {
    goToSlide(visibleSections.length - 1);
  }, [visibleSections.length, goToSlide]);

  const handleVerticalNavigation = useCallback((direction: 'up' | 'down') => {
    const currentSection = visibleSections[currentSlide];
    if (!currentSection?.verticalSlides?.length) return;

    if (direction === 'down' && currentVerticalSlide < currentSection.verticalSlides.length - 1) {
      setCurrentVerticalSlide(currentVerticalSlide + 1);
    } else if (direction === 'up' && currentVerticalSlide > 0) {
      setCurrentVerticalSlide(currentVerticalSlide - 1);
    }
  }, [currentSlide, currentVerticalSlide, visibleSections]);

  // Auto-play functionality
  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      setIsAutoPlaying(false);
    } else {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % visibleSections.length);
      }, 5000);
      setIsAutoPlaying(true);
    }
  }, [isAutoPlaying, visibleSections.length]);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      
      // Prevent navigation if user is editing content
      if (e.target && (e.target as HTMLElement).contentEditable === 'true') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ': // Spacebar
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVerticalNavigation('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVerticalNavigation('down');
          break;
        case 'Home':
          e.preventDefault();
          goToFirstSlide();
          break;
        case 'End':
          e.preventDefault();
          goToLastSlide();
          break;
        case 'Escape':
          e.preventDefault();
          if (isAutoPlaying) toggleAutoPlay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, handleVerticalNavigation, isTransitioning, goToFirstSlide, goToLastSlide, isAutoPlaying, toggleAutoPlay]);

  // Touch navigation with improved gesture detection
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const minSwipeDistance = 50;
    const maxVerticalDeviation = 100;

    // Prioritize horizontal swipes for slide navigation
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDeviation) {
      e.preventDefault();
      if (deltaX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    // Vertical swipes for vertical slide navigation
    else if (Math.abs(deltaY) > minSwipeDistance && Math.abs(deltaX) < maxVerticalDeviation) {
      e.preventDefault();
      if (deltaY > 0) {
        handleVerticalNavigation('up');
      } else {
        handleVerticalNavigation('down');
      }
    }

    setTouchStart(null);
  };

  // Cleanup auto-play on unmount
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, []);

  // Pause auto-play when user interacts
  useEffect(() => {
    if (isAutoPlaying && (isTransitioning || touchStart)) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
      setTimeout(() => {
        if (isAutoPlaying) {
          autoPlayRef.current = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % visibleSections.length);
          }, 5000);
        }
      }, 10000); // Resume after 10 seconds of inactivity
    }
  }, [isTransitioning, touchStart, isAutoPlaying, visibleSections.length]);

  if (visibleSections.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No visible slides</h2>
          <p>Please add some slides or make existing slides visible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-gray-900">
      <Header
        config={headerConfig}
        currentSlide={currentSlide}
        totalSlides={visibleSections.length}
        onSlideClick={goToSlide}
      />

      <div 
        className="flex h-full transition-transform duration-700 ease-out"
        style={{
          transform: `translateX(-${currentSlide * 100}vw)`,
          width: `${visibleSections.length * 100}vw`
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {visibleSections.map((section, index) => {
          const isActive = index === currentSlide;
          const verticalSlides = section.verticalSlides || [];
          const hasVerticalSlides = verticalSlides.length > 0;

          return (
            <div
              key={section.id}
              data-slide-id={section.id}
              className="min-w-full h-full relative overflow-y-auto overflow-x-hidden scroll-smooth"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {/* Background */}
              {section.backgroundVideo && isActive && (
                <VideoBackground config={section.backgroundVideo} />
              )}
              {section.backgroundImage && (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${section.backgroundImage})` }}
                >
                  <div className="absolute inset-0 bg-black/30" />
                </div>
              )}
              {section.backgroundColor && (
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: section.backgroundColor }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 min-h-full flex flex-col">
                {/* Main slide content */}
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center text-white max-w-4xl">
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
                      {section.title}
                    </h2>
                    <p className="text-xl md:text-2xl mb-8 drop-shadow">
                      {section.content}
                    </p>
                    
                    {hasVerticalSlides && (
                      <div className="text-sm opacity-75 mb-4">
                        Vertical Slides: {currentVerticalSlide + 1} of {verticalSlides.length}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="text-lg">
                        This content can scroll vertically within the slide.
                      </div>
                      <div className="h-64 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <p>This is scrollable content within the slide. The horizontal navigation works independently from this vertical scroll.</p>
                        <div className="mt-4 space-y-2">
                          <div className="h-2 bg-white/20 rounded"></div>
                          <div className="h-2 bg-white/20 rounded w-3/4"></div>
                          <div className="h-2 bg-white/20 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vertical slides */}
                {hasVerticalSlides && verticalSlides.map((verticalSlide, vIndex) => (
                  <div
                    key={verticalSlide.id}
                    className={`min-h-screen flex items-center justify-center p-8 transition-all duration-500 ${
                      currentVerticalSlide === vIndex && isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
                    }`}
                    style={{
                      backgroundColor: verticalSlide.backgroundColor || 'rgba(0,0,0,0.5)'
                    }}
                  >
                    <div className="text-center text-white max-w-4xl">
                      <h3 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">
                        {verticalSlide.title}
                      </h3>
                      <p className="text-lg md:text-xl drop-shadow">
                        {verticalSlide.content}
                      </p>
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }, (_, i) => (
                          <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Feature {i + 1}</h4>
                            <p className="text-sm opacity-75">Description of this amazing feature.</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Extra content for testing vertical scroll */}
                <div className="bg-black/20 backdrop-blur-sm m-8 rounded-lg p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Additional Content</h3>
                  <p className="mb-4">This demonstrates that each slide can have its own vertical scrolling content that works independently from horizontal navigation.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div key={i} className="p-4 bg-white/10 rounded transition-all duration-200 hover:bg-white/20">
                        <h4 className="font-semibold mb-2">Content Block {i + 1}</h4>
                        <p className="text-sm opacity-75">This content scrolls vertically within the slide and demonstrates the independent scrolling behavior.</p>
                        <div className="mt-2 flex space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slide indicator */}
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm backdrop-blur-sm">
                Slide {index + 1} of {visibleSections.length}
              </div>

              {/* Loading indicator for background video */}
              {section.backgroundVideo && !isActive && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-pulse w-16 h-16 bg-white/20 rounded-full mb-4 mx-auto"></div>
                    <p>Loading...</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Navigation
        config={navigationConfig}
        currentSlide={currentSlide}
        totalSlides={visibleSections.length}
        onNavigate={goToSlide}
      />

      {/* Enhanced navigation controls */}
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full disabled:opacity-50 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="fixed right-20 top-1/2 transform -translate-y-1/2 z-40 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full disabled:opacity-50 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Auto-play control */}
      <button
        onClick={toggleAutoPlay}
        className={`fixed right-4 bottom-20 z-40 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 ${
          isAutoPlaying ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
        }`}
        aria-label={isAutoPlaying ? 'Stop auto-play' : 'Start auto-play'}
        title={isAutoPlaying ? 'Stop auto-play' : 'Start auto-play'}
      >
        {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Vertical navigation indicator */}
      {visibleSections[currentSlide]?.verticalSlides && visibleSections[currentSlide].verticalSlides!.length > 0 && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center space-y-2">
          <div className="text-white text-sm bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
            ↕ Vertical: {currentVerticalSlide + 1}/{visibleSections[currentSlide].verticalSlides!.length}
          </div>
          <div className="flex flex-col space-y-1">
            {visibleSections[currentSlide].verticalSlides!.map((_, vIndex) => (
              <button
                key={vIndex}
                onClick={() => setCurrentVerticalSlide(vIndex)}
                className={`w-2 h-2 rounded-full border border-white transition-all duration-200 hover:scale-125 ${
                  currentVerticalSlide === vIndex ? 'bg-white' : 'bg-transparent'
                }`}
                aria-label={`Go to vertical slide ${vIndex + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Enhanced instructions */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-black/70 text-white px-4 py-2 rounded text-sm text-center backdrop-blur-sm max-w-md">
        <div className="mb-1">← → / PgUp PgDn / Space: Navigate slides</div>
        <div className="mb-1">↑ ↓: Navigate vertical content</div>
        <div className="mb-1">Home / End: First / Last slide</div>
        <div>Swipe / Scroll within slides / ESC: Stop autoplay</div>
      </div>

      {/* Progress indicator */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="h-1 bg-black/30">
          <div 
            className="h-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${((currentSlide + 1) / visibleSections.length) * 100}%` }}
          />
        </div>
      </div>

      <SlideManagementPanel
        sections={sections}
        setSections={setSections}
        currentSlide={currentSlide}
        currentVerticalSlide={currentVerticalSlide}
        setCurrentVerticalSlide={setCurrentVerticalSlide}
        goToSlide={goToSlide}
      />
    </div>
  );
};

export default FullPageSlider;
