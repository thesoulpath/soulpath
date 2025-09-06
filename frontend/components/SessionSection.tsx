'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AstralChart } from './AstralChart';

interface SessionSectionProps {
  t: Record<string, string | Record<string, string>>;
  scrollToSection: (section: string) => void;
}

export function SessionSection({ t, scrollToSection }: SessionSectionProps) {
  const deliverableIcons = [Clock, FileText, Headphones];
  
  return (
    <section className="h-full flex flex-col justify-start px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-hidden safe-padding pt-20 sm:pt-24 lg:pt-28">
      <div className="container mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="order-2 md:order-1"
          >
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-3xl lg:text-4xl xl:text-5xl font-heading text-[#EAEAEA] mb-4 sm:mb-6 leading-tight">
              {typeof t.session === 'object' && t.session?.title || 'Book Your Session'}
            </h2>

            <div className="text-3xl xs:text-4xl sm:text-5xl md:text-3xl lg:text-4xl font-heading text-[#FFD700] mb-4 sm:mb-6 cosmic-glow">
              {typeof t.session === 'object' && t.session?.price || '$150'}
            </div>

            <p className="text-sm sm:text-base md:text-sm lg:text-base text-[#EAEAEA]/80 leading-relaxed mb-6 sm:mb-8 max-w-2xl">
              {typeof t.session === 'object' && t.session?.description || 'Ready to begin your spiritual journey?'}
            </p>

            <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              {(typeof t.session === 'object' && t.session?.deliverables && Array.isArray(t.session.deliverables) ? t.session.deliverables : ['Personalized Reading', 'Detailed Analysis', 'Follow-up Support']).map((item: string, index: number) => {
                const Icon = deliverableIcons[index];
                return (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start space-x-3 sm:space-x-4"
                  >
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-[#FFD700]/10 rounded-full flex items-center justify-center border border-[#FFD700]/20">
                      <Icon size={16} className="sm:w-5 sm:h-5 text-[#FFD700]" />
                    </div>
                    <span className="text-sm sm:text-base text-[#EAEAEA] leading-relaxed pt-1 sm:pt-1.5">{item}</span>
                  </motion.div>
                );
              })}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                onClick={() => scrollToSection('apply')}
                className="bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-lg shadow-lg shadow-[#FFD700]/20 cosmic-glow w-full sm:w-auto touch-manipulation"
              >
                {typeof t.session === 'object' && t.session?.cta || 'Get Started'}
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative order-1 md:order-2"
          >
            <div className="bg-gradient-to-br from-[#191970]/30 to-[#0A0A23]/30 p-3 sm:p-6 md:p-4 lg:p-8 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-[#C0C0C0]/10 relative overflow-hidden">
              {/* Background cosmic elements */}
              <div className="absolute inset-0 opacity-5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="absolute top-2 sm:top-4 right-2 sm:right-4 w-8 sm:w-16 h-8 sm:h-16 border border-[#FFD700]/20 rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 w-6 sm:w-12 h-6 sm:h-12 border border-[#C0C0C0]/20 rounded-full"
                />
              </div>
              
              {/* Astral Chart */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="relative z-10"
              >
                <AstralChart />
              </motion.div>
              
              {/* Chart label */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="text-center mt-3 sm:mt-6"
              >
                <p className="text-[#FFD700] font-heading text-sm sm:text-base lg:text-lg">
                  Your Cosmic Blueprint
                </p>
                <p className="text-[#EAEAEA]/60 text-xs sm:text-sm mt-1 sm:mt-2">
                  Personalized astrological analysis
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
