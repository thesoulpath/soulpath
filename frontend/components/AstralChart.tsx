'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function AstralChart() {
  return (
    <div className="relative w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 mx-auto">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 320 320"
        className="absolute inset-0 max-w-full max-h-full astral-chart-svg"
      >
        {/* Outer ring */}
        <circle cx="160" cy="160" r="150" fill="none" stroke="rgba(255, 215, 0, 0.3)" strokeWidth="2" />
        
        {/* Inner ring */}
        <circle cx="160" cy="160" r="90" fill="none" stroke="rgba(192, 192, 192, 0.4)" strokeWidth="1" />
        
        {/* Center dot */}
        <circle cx="160" cy="160" r="3" fill="#FFD700" className="cosmic-glow" />
        
        {/* Zodiac signs positions */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const x = 160 + 130 * Math.cos((angle - 90) * Math.PI / 180);
          const y = 160 + 130 * Math.sin((angle - 90) * Math.PI / 180);
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="rgba(255, 215, 0, 0.6)"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3 + i * 0.2, repeat: Infinity }}
            />
          );
        })}
        
        {/* Planetary positions */}
        {[45, 135, 225, 315].map((angle, i) => {
          const x = 160 + 70 * Math.cos((angle - 90) * Math.PI / 180);
          const y = 160 + 70 * Math.sin((angle - 90) * Math.PI / 180);
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="rgba(192, 192, 192, 0.7)"
              animate={{ 
                scale: [1, 1.5, 1], 
                opacity: [0.5, 1, 0.5],
                rotate: [0, 360]
              }}
              transition={{ duration: 4 + i * 0.3, repeat: Infinity }}
            />
          );
        })}
        
        {/* Aspect lines */}
        <line x1="160" y1="70" x2="160" y2="250" stroke="rgba(255, 215, 0, 0.2)" strokeWidth="1" />
        <line x1="70" y1="160" x2="250" y2="160" stroke="rgba(255, 215, 0, 0.2)" strokeWidth="1" />
      </svg>
      
      {/* Floating cosmic particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 sm:w-1 sm:h-1 bg-[#FFD700] rounded-full"
          style={{
            left: `${25 + Math.random() * 50}%`,
            top: `${25 + Math.random() * 50}%`,
          }}
          animate={{
            x: [0, 8, -8, 0],
            y: [0, -12, 8, 0],
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}
