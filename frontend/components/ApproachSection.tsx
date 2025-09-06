'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Circle, TrendingUp } from 'lucide-react';

interface ApproachSectionProps {
  t: Record<string, string | Record<string, string>>;
}

export function ApproachSection({ t }: ApproachSectionProps) {
  const icons = [Sun, Circle, TrendingUp];
  
  return (
    <section className="h-full flex flex-col justify-start px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative overflow-hidden safe-padding pt-20 sm:pt-24 lg:pt-28">
      {/* Background cosmic elements */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-16 sm:w-24 h-16 sm:h-24 border border-[#FFD700]/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-12 sm:w-20 h-12 sm:h-20 border border-[#C0C0C0]/20 rounded-full"
        />
      </div>
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-heading text-[#EAEAEA] mb-4 sm:mb-6 leading-tight px-2">
            {(t.approach as Record<string, any>).title}
          </h2>
          <div className="w-16 sm:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mx-auto"></div>
        </motion.div>
        
        {/* Three-step process */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-3 md:gap-8 lg:gap-12 max-w-6xl mx-auto">
          {(t.approach as Record<string, any>).items.map((item: { title: string; description: string }, index: number) => {
            const Icon = icons[index];
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                className="relative group"
              >
                {/* Connection line for desktop */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 lg:top-16 -right-4 lg:-right-6 w-8 lg:w-12 h-px bg-gradient-to-r from-[#FFD700]/50 to-transparent z-10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 1, delay: index * 0.3 + 0.5 }}
                      className="h-full bg-[#FFD700]/50"
                    />
                  </div>
                )}
                
                {/* Card container */}
                <div className="relative bg-gradient-to-br from-[#191970]/25 to-[#0A0A23]/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-6 lg:p-8 border border-[#C0C0C0]/10 group-hover:border-[#FFD700]/30 transition-all duration-300 h-full min-h-[280px] sm:min-h-[320px]">
                  {/* Step number */}
                  <div className="absolute -top-3 sm:-top-4 left-4 sm:left-6 w-6 h-6 sm:w-8 sm:h-8 bg-[#FFD700] text-[#0A0A23] rounded-full flex items-center justify-center font-heading text-sm sm:text-base cosmic-glow">
                    {index + 1}
                  </div>
                  
                  {/* Icon section */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                    className="flex justify-center mb-4 sm:mb-6 mt-2 sm:mt-4"
                  >
                    <div className="relative">
                      {/* Outer rotating ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 w-14 h-14 sm:w-20 sm:h-20 border border-[#FFD700]/20 rounded-full -m-1 sm:-m-2"
                      />
                      
                      {/* Icon container */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#191970]/60 to-[#0A0A23]/80 rounded-full flex items-center justify-center border border-[#FFD700]/40 group-hover:border-[#FFD700] transition-all duration-300 cosmic-glow">
                        <Icon size={20} className="sm:w-7 sm:h-7 text-[#FFD700]" />
                      </div>
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 bg-[#FFD700]/10 rounded-full blur-md sm:blur-lg group-hover:bg-[#FFD700]/20 transition-all duration-300" />
                    </div>
                  </motion.div>
                  
                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.2 + 0.5 }}
                    className="text-center"
                  >
                    <h3 className="text-lg sm:text-xl md:text-2xl font-heading text-[#EAEAEA] mb-3 sm:mb-4 relative leading-tight">
                      {item.title}
                      <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-8 sm:w-12 h-0.5 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent"></div>
                    </h3>
                    
                    <p className="text-sm sm:text-base text-[#EAEAEA]/80 leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#FFD700]/60 rounded-full"></div>
                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-1 h-1 bg-[#C0C0C0]/60 rounded-full"></div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Bottom decorative cosmic element */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex justify-center mt-8 sm:mt-12"
        >
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4
                }}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#FFD700] rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
