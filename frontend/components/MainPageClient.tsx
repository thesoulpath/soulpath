'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useProfileImage } from '@/hooks/useProfileImage';
import { useTranslations, useLanguage } from '@/hooks/useTranslations';
import { useAuth } from '@/hooks/useAuth';
import { AdminDashboard } from '@/components/AdminDashboard';
import LoginModal from '@/components/LoginModal';
import { BookingSection } from '@/components/BookingSection';



interface TranslationProps {
  t: Record<string, string | Record<string, string>>;
}

interface SessionSectionProps extends TranslationProps {
  scrollToSection: (sectionId: string) => void;
}

interface HeaderProps extends TranslationProps {
  language: string;
  setLanguage: (lang: 'en' | 'es') => void;
  onLoginClick: () => void;
}

interface MainPageClientProps {
  content: Record<string, string>;
  initialContent: Record<string, unknown>;
  initialProfileImage: string | undefined;
}



// Header Component
function Header({
  language,
  setLanguage,
  t,
  onLoginClick
}: HeaderProps) {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-[9997] bg-black/20 backdrop-blur-md border-b border-white/10"
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="font-heading text-lg sm:text-xl md:text-2xl text-[#FFD700]">
              SOULPATH
            </span>
          </motion.div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  language === 'en'
                    ? 'bg-[#FFD700] text-[#0A0A23] shadow-lg'
                    : 'text-[#C0C0C0] hover:text-[#FFD700] hover:bg-[#FFD700]/10'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  language === 'es'
                    ? 'bg-[#FFD700] text-[#0A0A23] shadow-lg'
                    : 'text-[#C0C0C0] hover:text-[#FFD700] hover:bg-[#FFD700]/10'
                }`}
              >
                ES
              </button>
            </div>
            
            <button
              onClick={onLoginClick}
              className="px-4 py-2 bg-[#FFD700] text-[#0A0A23] rounded-lg font-medium hover:bg-[#FFD700]/90 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {typeof t?.admin === 'object' && t.admin?.login || 'Login'}
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

// HeroSection Component
function HeroSection({ t }: TranslationProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative h-screen flex items-center justify-center text-center px-6"
    >
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl sm:text-6xl md:text-7xl font-heading text-[#EAEAEA] mb-6 leading-tight"
        >
          {typeof t?.hero === 'object' && t.hero?.title || 'SOULPATH'}
        </motion.h1>
        
        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl sm:text-2xl text-[#C0C0C0] mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          {typeof t?.hero === 'object' && t.hero?.subtitle || 'Transform your life through spiritual guidance and healing'}
        </motion.p>
        
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-sm text-[#C0C0C0]/70"
        >
          {typeof t?.hero === 'object' && t.hero?.scrollHint || 'Scroll to explore'}
        </motion.div>
      </div>
    </motion.section>
  );
}

// ApproachSection Component
function ApproachSection({ t }: TranslationProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative h-screen flex items-center justify-center px-6"
    >
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-4xl sm:text-5xl font-heading text-[#FFD700] mb-12"
        >
          {typeof t?.approach === 'object' && t.approach?.title || 'Our Approach'}
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
              className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-heading text-[#EAEAEA] mb-4">
                {typeof t?.approach === 'object' && t.approach?.[`step${i}Title`] || `Step ${i}`}
              </h3>
              <p className="text-[#C0C0C0] leading-relaxed">
                {typeof t?.approach === 'object' && t.approach?.[`step${i}Description`] || `Description for step ${i}`}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// SessionSection Component
function SessionSection({ t, scrollToSection }: SessionSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative h-screen flex items-center justify-center px-6"
    >
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-4xl sm:text-5xl font-heading text-[#FFD700] mb-8"
        >
          {typeof t?.session === 'object' && t.session?.title || 'Book Your Session'}
        </motion.h2>
        
        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl text-[#C0C0C0] mb-8 leading-relaxed"
        >
          {typeof t?.session === 'object' && t.session?.description || 'Ready to begin your spiritual journey?'}
        </motion.p>
        
        <motion.button
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          onClick={() => scrollToSection('apply')}
          className="px-8 py-4 bg-[#FFD700] text-[#0A0A23] rounded-lg font-medium hover:bg-[#FFD700]/90 transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
        >
          {typeof t?.session === 'object' && t.session?.cta || 'Get Started'}
        </motion.button>
      </div>
    </motion.section>
  );
}

// AboutSection Component
function AboutSection({ t }: TranslationProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative h-screen flex items-center justify-center px-6"
    >
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-4xl sm:text-5xl font-heading text-[#FFD700] mb-8"
        >
          {typeof t?.about === 'object' && t.about?.title || 'About Us'}
        </motion.h2>
        
        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl text-[#C0C0C0] mb-8 leading-relaxed"
        >
          {typeof t?.about === 'object' && t.about?.description || 'Learn more about our mission and approach to spiritual healing.'}
        </motion.p>
      </div>
    </motion.section>
  );
}



// ConstellationBackground Component
function ConstellationBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#191970]/20 via-transparent to-[#0A0A23]/20"></div>
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-[#FFD700] rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}

// Main Page Component
export default function MainPageClient({
  initialContent,
  initialProfileImage
}: MainPageClientProps) {
  const { language, setLanguage } = useLanguage();
  const { t, isLoading: isLoadingTranslations } = useTranslations(initialContent);
  const { } = useProfileImage(initialProfileImage);

  const { signIn } = useAuth();
  
  const [currentSection, setCurrentSection] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const sections = ['invitation', 'approach', 'session', 'about', 'apply'];

  // Fullpage scroll functionality
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (showAdmin || showLoginModal || isMenuOpen || isScrolling) return;
      e.preventDefault();
      setIsScrolling(true);
      
      const direction = e.deltaY > 0 ? 1 : -1;
      setCurrentSection((prev) => {
        const next = prev + direction;
        return Math.max(0, Math.min(sections.length - 1, next));
      });
      
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setIsScrolling(false), 800);
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (showAdmin || showLoginModal || isMenuOpen) return;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (showAdmin || showLoginModal || isMenuOpen || isScrolling) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      const minSwipeDistance = 50;
      
      if (Math.abs(diff) > minSwipeDistance) {
        setIsScrolling(true);
        if (diff > 0) {
          setCurrentSection((prev) => Math.min(sections.length - 1, prev + 1));
        } else {
          setCurrentSection((prev) => Math.max(0, prev - 1));
        }
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => setIsScrolling(false), 800);
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [showAdmin, showLoginModal, isMenuOpen, sections.length, isScrolling]);

  const scrollToSection = (sectionName: string) => {
    const index = sections.indexOf(sectionName);
    if (index !== -1) {
      setCurrentSection(index);
    }
    setIsMenuOpen(false);
  };

  const scrollToSectionByIndex = (index: number) => {
    setCurrentSection(index);
  };

  const handleLoginClick = () => {
    setShowAdmin(true);
  };

  if (showAdmin) {
    return (
      <AdminDashboard onClose={() => setShowAdmin(false)} />
    );
  }

  if (isLoadingTranslations) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-b from-[#191970] to-[#0A0A23] text-[#EAEAEA] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-[#191970] to-[#0A0A23] text-[#EAEAEA] mobile-container">
      <ConstellationBackground />
      
      <Header
        language="en"
        setLanguage={setLanguage}
        t={t}
        onLoginClick={handleLoginClick}
      />
      
      <div 
        className="fullpage-container" 
        style={{ transform: `translateY(-${currentSection * 100}vh)` }}
      >
        <section id="invitation">
          <HeroSection t={t} />
        </section>
        <section id="approach">
          <ApproachSection t={t} />
        </section>
        <section id="session">
          <SessionSection t={t} scrollToSection={scrollToSection} />
        </section>
        <section id="about">
          <AboutSection t={t} />
        </section>
        <section id="apply">
          <BookingSection t={t} language={language} />
        </section>
      </div>
      
      {/* Navigation Dots */}
      <div className="fixed right-2 sm:right-3 lg:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col space-y-2 sm:space-y-3 lg:space-y-4 navigation-dots">
        {sections.map((section, index) => (
          <motion.button
            key={section}
            onClick={() => scrollToSectionByIndex(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 transition-all duration-300 touch-manipulation relative ${
              currentSection === index
                ? 'bg-[#FFD700] border-[#FFD700] cosmic-glow shadow-lg shadow-[#FFD700]/30'
                : 'bg-transparent border-[#C0C0C0]/50 hover:border-[#FFD700] hover:bg-[#FFD700]/10'
            }`}
            title={section}
            aria-label={`Go to ${section} section`}
          />
        ))}
      </div>
      
      {/* Next Section Arrow */}
      <AnimatePresence>
        {currentSection < sections.length - 1 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scrollToSectionByIndex(currentSection + 1)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full border-2 border-[#C0C0C0]/30 bg-black/20 backdrop-blur-md flex items-center justify-center text-[#C0C0C0] hover:text-[#FFD700] hover:border-[#FFD700]/50 transition-all duration-300 z-[9995] navigation-arrow touch-manipulation"
            aria-label="Next section"
          >
            <ChevronRight size={20} />
          </motion.button>
        )}
      </AnimatePresence>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLogin={async (email: string, password: string) => {
          try {
            const { data, error } = await signIn(email, password);
            if (error) {
              console.error('Login error:', error);
              return false;
            }
            if (data) {
              setShowLoginModal(false);
              setShowAdmin(true);
              return true;
            }
            return false;
          } catch (error) {
            console.error('Login failed:', error);
            return false;
          }
        }}
      />
    </div>
  );
}
