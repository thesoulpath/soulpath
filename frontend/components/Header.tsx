'use client';

import React, { useEffect } from 'react';
import { Menu, X, LogIn, Settings, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { useLogo } from '../hooks/useLogo';

interface HeaderProps {
  language: "en" | "es";
  setLanguage: (language: "en" | "es") => void;
  scrollToSection: (section: string) => void;
  t: Record<string, string | Record<string, string>>;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  onLoginClick: () => void;
  user: { email: string } | null;
  isAdmin: boolean;
}

export function Header({ 
  language, 
  setLanguage, 
  scrollToSection, 
  t, 
  isMenuOpen, 
  setIsMenuOpen, 
  onLoginClick,
  user,
  isAdmin
}: HeaderProps) {
  const { logoSettings } = useLogo();
  
  // Handle touch gestures for closing menu
  useEffect(() => {
    if (!isMenuOpen) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = Math.abs(touchEndY - touchStartY);
      
      // Swipe right to close (with minimum distance and prevent vertical scrolling conflicts)
      if (deltaX > 100 && deltaY < 50 && touchStartX < 50) {
        setIsMenuOpen(false);
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('keydown', handleEscape);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen, setIsMenuOpen]);
  
  return (
    <header className="fixed top-0 left-0 right-0 z-[9997] bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between header-container">
        <motion.div 
          className="flex items-center space-x-2 cursor-pointer touch-manipulation"
          onClick={() => scrollToSection('invitation')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {logoSettings.isActive ? (
            logoSettings.type === 'text' ? (
              <span className="font-heading text-lg sm:text-xl md:text-2xl text-[#FFD700]">
                {logoSettings.text || 'SOULPATH'}
              </span>
            ) : logoSettings.imageUrl ? (
              <img 
                src={logoSettings.imageUrl} 
                alt="SoulPath Logo" 
                className="h-6 sm:h-8 md:h-10 object-contain"
              />
            ) : (
              <span className="font-heading text-lg sm:text-xl md:text-2xl text-[#FFD700]">SOULPATH</span>
            )
          ) : (
            <span className="font-heading text-lg sm:text-xl md:text-2xl text-[#FFD700]">SOULPATH</span>
          )}
        </motion.div>
        
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="hidden sm:flex items-center space-x-2">
            <button 
              onClick={() => setLanguage('en')}
              className={`touch-manipulation ${
                language === 'en' ? 'header-button-language-active' : 'header-button-language-inactive'
              }`}
            >
              EN
            </button>
            <span className="text-[#C0C0C0]/50">|</span>
            <button 
              onClick={() => setLanguage('es')}
              className={`touch-manipulation ${
                language === 'es' ? 'header-button-language-active' : 'header-button-language-inactive'
              }`}
            >
              ES
            </button>
          </div>
          
          {/* User Account Access */}
          {user && !isAdmin && (
            <Link href="/account">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center space-x-1 header-button-account"
              >
                <User size={14} />
                <span>Account</span>
              </motion.button>
            </Link>
          )}
          
          {/* Admin Login Button */}
          {user && isAdmin ? (
            <motion.button
              onClick={onLoginClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex items-center space-x-1 header-button-account"
            >
              <Settings size={14} />
              <span>Dashboard</span>
            </motion.button>
          ) : (
            <motion.button
              onClick={onLoginClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex items-center space-x-1 header-button-language-inactive"
            >
              <LogIn size={14} />
              <span>{(t.nav as Record<string, string>).login || 'Login'}</span>
            </motion.button>
          )}
          
          <motion.button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center rounded-lg header-button-menu touch-manipulation focus-visible px-3 py-2 sm:px-2 sm:py-2"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {/* Mobile: Show "Menu" text */}
            <span className="sm:hidden text-sm font-medium">
              {isMenuOpen ? 'Close' : 'Menu'}
            </span>
            
            {/* Desktop: Show hamburger icon */}
            <motion.div
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="hidden sm:block"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.div>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
