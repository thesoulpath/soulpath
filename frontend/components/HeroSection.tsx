'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  t: Record<string, string | Record<string, string>>;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="h-full flex flex-col items-center justify-start text-center px-4 sm:px-6 md:px-8 relative safe-padding pt-20 sm:pt-24 lg:pt-28">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-4 h-4 sm:w-5 sm:h-5 bg-[#FFD700] rounded-full mb-6 sm:mb-8 md:mb-10 shadow-lg shadow-[#FFD700]/50 cosmic-glow"
      />
      
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading text-[#EAEAEA] mb-4 sm:mb-6 md:mb-8 max-w-6xl leading-tight px-2"
      >
        {(t.hero as Record<string, string>).title}
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="text-base xs:text-lg sm:text-xl md:text-2xl text-[#EAEAEA]/85 max-w-4xl mb-8 sm:mb-12 md:mb-16 leading-relaxed px-4"
      >
        {(t.hero as Record<string, string>).subtitle}
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="flex items-center space-x-3 text-[#C0C0C0] mt-4"
      >
        <span className="text-sm sm:text-base font-body">{(t.hero as Record<string, string>).scrollDown}</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={20} className="sm:w-6 sm:h-6" />
        </motion.div>
      </motion.div>
    </section>
  );
}
