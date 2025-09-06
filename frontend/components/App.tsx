'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Star, Compass, Clock, User, Calendar, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { useTranslations, useLanguage } from '@/hooks/useTranslations';
import { useContentManagement } from '@/hooks/useContentManagement';
import DynamicSectionRenderer from './DynamicSectionRenderer';

import { Header } from './Header';
import { ConstellationBackground } from './ConstellationBackground';
import { MobileMenu } from './MobileMenu';
import LoginModal from './LoginModal';
import { AdminDashboard } from './AdminDashboard';
import { ChatWindow } from './ChatWindow';

export function App() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslations(undefined, language);
  const [currentSection, setCurrentSection] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [hasExplicitlyClosed, setHasExplicitlyClosed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, isAdmin, signIn } = useAuth();
  const { sections } = useContentManagement();

  // Debug logging for language changes
  console.log('🌐 App Component - Current language:', language);
  console.log('🌐 App Component - Current translations:', t?.nav?.invitation);

  // Fullpage scroll functionality
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (showAdmin || showLoginModal || isMenuOpen) return;
      
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      
      setCurrentSection((prev) => {
        const next = prev + direction;
        return Math.max(0, Math.min(sections.length - 1, next));
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAdmin || showLoginModal || isMenuOpen) return;
      
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        setCurrentSection((prev) => Math.min(sections.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        setCurrentSection((prev) => Math.max(0, prev - 1));
      }
    };

    let touchStartY = 0;
    let touchStartTime = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (showAdmin || showLoginModal || isMenuOpen) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const diff = touchStartY - touchEndY;
      const timeDiff = touchEndTime - touchStartTime;
      const minSwipeDistance = 40; // Reduced for better mobile responsiveness
      const maxSwipeTime = 500; // Maximum time for a valid swipe

      // Only register swipe if it's fast enough and far enough
      if (Math.abs(diff) > minSwipeDistance && timeDiff < maxSwipeTime) {
        if (diff > 0) {
          setCurrentSection((prev) => Math.min(sections.length - 1, prev + 1));
        } else {
          setCurrentSection((prev) => Math.max(0, prev - 1));
        }
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showAdmin, showLoginModal, isMenuOpen, sections.length]);

  const scrollToSection = (sectionId: string) => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (index !== -1) {
      setCurrentSection(index);
    }
    setIsMenuOpen(false);
  };

  const scrollToSectionByIndex = (index: number) => {
    setCurrentSection(index);
  };

  const handleLoginClick = () => {
    if (user && isAdmin) {
      setShowAdmin(true);
      setHasExplicitlyClosed(false);
    } else {
      setShowLoginModal(true);
    }
  };

  // Handle successful authentication - don't auto-redirect, let user choose
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { user: !!user, isAdmin, showAdmin, hasExplicitlyClosed, showLoginModal });
    
    if (user && isAdmin) {
      // If user is authenticated and is admin, just close login modal
      if (showLoginModal) {
        setShowLoginModal(false);
      }
      
      console.log('✅ Admin user authenticated, ready for admin dashboard');
    } else if (!user) {
      // If user logs out, return to main page
      console.log('🚪 User logged out, hiding admin dashboard');
      setShowAdmin(false);
      setHasExplicitlyClosed(false);
    }
  }, [user, isAdmin, showLoginModal, hasExplicitlyClosed, showAdmin]);

  // Don't render navigation elements until translations are loaded
  // Only check for essential translations to avoid endless loading
  if (!t || !t.hero || !t.nav) {
    return (
      <div className="min-h-screen bg-[#0A0A23] flex items-center justify-center">
        <div className="text-[#FFD700] text-xl">Loading...</div>
      </div>
    );
  }

  // Show admin dashboard when requested
  if (showAdmin) {
    return (
      <AdminDashboard 
        onClose={() => {
          console.log('🔴 Close button clicked, setting hasExplicitlyClosed to true');
          setShowAdmin(false);
          setHasExplicitlyClosed(true);
        }} 
        isModal={false}
      />
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-[#191970] to-[#0A0A23] text-[#EAEAEA] mobile-container">
      <ConstellationBackground />
      
      <Header 
        language={language}
        setLanguage={setLanguage}
        scrollToSection={scrollToSection}
        t={t}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onLoginClick={handleLoginClick}
        user={user}
        isAdmin={isAdmin}
      />
      
      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        sections={sections.map(s => s.id)}
        currentSection={currentSection}
        scrollToSection={scrollToSection}
        language={language}
        setLanguage={setLanguage}
        t={t}
        user={user}
        isAdmin={isAdmin}
        onLoginClick={handleLoginClick}
        onAdminClick={() => setShowAdmin(true)}
      />

      {/* Main content sections */}
      <main className="h-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.98 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.4, 0.0, 0.2, 1], // Custom easing for smoother mobile feel
              scale: { duration: 0.4 }
            }}
            className="h-full"
          >
            {sections[currentSection] && (
              <DynamicSectionRenderer
                section={sections[currentSection]}
                t={t}
                language={language}
                scrollToSection={scrollToSection}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Section Navigation Icons */}
      <div className="fixed right-2 sm:right-3 lg:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col space-y-3 sm:space-y-4 lg:space-y-5 navigation-icons">
        {sections.map((section, index) => {
          // Get icon component based on section icon name
          const getSectionIcon = (iconName: string) => {
            switch (iconName) {
              case 'Star':
                return <Star size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />;
              case 'Compass':
                return <Compass size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />;
              case 'Clock':
                return <Clock size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />;
              case 'User':
                return <User size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />;
              case 'Calendar':
                return <Calendar size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />;
              default:
                return <Circle size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />;
            }
          };

          return (
            <motion.button
              key={section.id}
              onClick={() => scrollToSectionByIndex(index)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-2 transition-all duration-300 touch-manipulation relative flex items-center justify-center ${
                currentSection === index 
                  ? 'bg-[#FFD700] border-[#FFD700] cosmic-glow shadow-lg shadow-[#FFD700]/30 text-[#0A0A23]' 
                  : 'bg-transparent border-[#C0C0C0]/50 hover:border-[#FFD700] hover:bg-[#FFD700]/10 text-[#C0C0C0] hover:text-[#FFD700]'
              }`}
              title={section.title}
              aria-label={`Go to ${section.title} section`}
            >
              {getSectionIcon(section.icon)}
              
              {/* Active indicator ring */}
              {currentSection === index && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0.3 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute inset-0 bg-[#FFD700] rounded-full -z-10"
                />
              )}
            </motion.button>
          );
        })}
      </div>



      {/* Navigation arrows */}
      {currentSection < sections.length - 1 && (
        <motion.button
          onClick={() => scrollToSectionByIndex(currentSection + 1)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-12 sm:h-12 rounded-full border-2 border-[#C0C0C0]/30 bg-black/30 backdrop-blur-md flex items-center justify-center text-[#C0C0C0] hover:text-[#FFD700] hover:border-[#FFD700]/50 transition-all duration-300 z-[9995] navigation-arrow touch-manipulation shadow-lg"
          aria-label="Next section"
        >
          <ChevronRight size={24} className="sm:w-5 sm:h-5" />
        </motion.button>
      )}

      {/* Fixed Bottom CTA Button - Shows on all pages except booking form */}
      <AnimatePresence>
        {currentSection !== 4 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed bottom-2 sm:bottom-4 lg:bottom-6 left-2 right-2 sm:left-0 sm:right-0 z-[9996] cta-button-container flex justify-center"
          >
            <motion.button
              onClick={() => scrollToSection('apply')}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 px-6 sm:px-8 lg:px-10 py-4 sm:py-3 lg:py-4 text-base sm:text-base lg:text-lg font-medium rounded-xl shadow-xl shadow-[#FFD700]/30 cosmic-glow touch-manipulation transition-all duration-300 whitespace-nowrap w-full sm:w-auto max-w-sm sm:max-w-none"
            >
              <div className="flex items-center justify-center space-x-3">
                <span>{t.cta.bookReading}</span>
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 bg-[#0A0A23] rounded-full flex-shrink-0"
                />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Login Modal */}
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
              return true;
            }
            return false;
          } catch (error) {
            console.error('Login failed:', error);
            return false;
          }
        }}
      />

      {/* Chat Window - Always available */}
      <ChatWindow />

    </div>
  );
}
