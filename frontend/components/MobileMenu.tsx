'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, Settings } from 'lucide-react';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  sections: string[];
  currentSection: number;
  scrollToSection: (section: string) => void;
  language: string;
  setLanguage: (lang: 'en' | 'es') => void;
  t: Record<string, string | Record<string, string>>;
  user: User | null;
  isAdmin: boolean;
  onLoginClick: () => void;
  onAdminClick: () => void;
}

export function MobileMenu({ 
  isOpen, 
  onClose, 
  sections, 
  currentSection, 
  scrollToSection, 
  language, 
  setLanguage, 
  t, 
  user, 
  isAdmin, 
  onLoginClick, 
  onAdminClick 
}: MobileMenuProps) {
  return (
    <div className="mobile-menu-container">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-[#191970]/95 to-[#0A0A23]/95 backdrop-blur-lg border-r border-[#C0C0C0]/20 z-[9999] mobile-menu"
            >
              <div className="flex flex-col h-full p-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="font-heading text-xl text-[#FFD700]">SOULPATH</span>
                  <button 
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#C0C0C0]/10 text-[#C0C0C0] hover:text-[#FFD700] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <nav className="flex-1 space-y-2">
                  {sections.map((section, index) => (
                    <button
                      key={section}
                      onClick={() => scrollToSection(section)}
                      className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-200 flex items-center space-x-4 touch-manipulation ${
                        currentSection === index
                          ? 'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/40 shadow-lg shadow-[#FFD700]/10'
                          : 'text-[#C0C0C0] hover:text-[#EAEAEA] hover:bg-[#C0C0C0]/10 active:bg-[#C0C0C0]/15'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        currentSection === index ? 'bg-[#FFD700] shadow-sm' : 'bg-[#C0C0C0]/50'
                      }`} />
                      <span className="text-base font-medium">
                        {typeof t.nav === 'object' && t.nav ? t.nav[section as keyof typeof t.nav] || section : section}
                      </span>
                    </button>
                  ))}
                </nav>
                
                <div className="border-t border-[#C0C0C0]/20 pt-6 mt-6">
                  <div className="flex items-center justify-center space-x-3 mb-6">
                    <button 
                      onClick={() => setLanguage('en')}
                      className={`px-6 py-3 rounded-xl transition-all duration-200 touch-manipulation font-medium ${
                        language === 'en' ? 'text-[#FFD700] bg-[#FFD700]/15 border border-[#FFD700]/30' : 'text-[#C0C0C0] hover:text-[#FFD700] hover:bg-[#C0C0C0]/10'
                      }`}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => setLanguage('es')}
                      className={`px-6 py-3 rounded-xl transition-all duration-200 touch-manipulation font-medium ${
                        language === 'es' ? 'text-[#FFD700] bg-[#FFD700]/15 border border-[#FFD700]/30' : 'text-[#C0C0C0] hover:text-[#FFD700] hover:bg-[#C0C0C0]/10'
                      }`}
                    >
                      Español
                    </button>
                  </div>
                  
                  {/* Admin Login Button in Mobile Menu */}
                  {!user && (
                    <motion.button
                      onClick={() => {
                        onClose();
                        onLoginClick();
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center space-x-3 text-[#C0C0C0] hover:text-[#FFD700] transition-all duration-200 px-6 py-4 rounded-xl hover:bg-[#FFD700]/10 border border-[#C0C0C0]/20 hover:border-[#FFD700]/30 touch-manipulation font-medium"
                    >
                      <LogIn size={18} />
                      <span>{typeof t.nav === 'object' && t.nav?.login || 'Login'}</span>
                    </motion.button>
                  )}
                  
                  {user && isAdmin && (
                    <motion.button
                      onClick={() => {
                        onClose();
                        onAdminClick();
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center space-x-3 text-[#FFD700] bg-[#FFD700]/15 px-6 py-4 rounded-xl border border-[#FFD700]/40 touch-manipulation font-medium shadow-lg shadow-[#FFD700]/10"
                    >
                      <Settings size={18} />
                      <span>Dashboard</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
