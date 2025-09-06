'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useProfileImage } from '@/hooks/useProfileImage';

interface AboutSectionProps {
  t: Record<string, string | Record<string, string>>;
}

export function AboutSection({ t }: AboutSectionProps) {
  const { profileImage, isLoading: isImageLoading } = useProfileImage();
  
  return (
    <>
      <style jsx>{`
        .image-container {
          --mobile-scale: 0.95;
          --desktop-scale: 1;
        }

        @media (max-width: 639px) {
          .image-container {
            transform: scale(var(--mobile-scale));
            transform-origin: center center;
          }
        }

        @media (min-width: 640px) {
          .image-container {
            transform: scale(var(--desktop-scale));
            transform-origin: center center;
          }
        }
      `}</style>
    <section className="h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-16 lg:pt-20 pb-12 sm:pb-16 lg:pb-20 overflow-hidden safe-padding">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="order-2 md:order-1 space-y-4 sm:space-y-6"
          >
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-3xl lg:text-4xl xl:text-5xl font-heading text-[#EAEAEA] leading-tight">
              {(t.about as Record<string, string>).title}
            </h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "4rem" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-0.5 bg-gradient-to-r from-[#FFD700] to-transparent"
            />
            <p className="text-sm sm:text-base md:text-sm lg:text-base xl:text-lg text-[#EAEAEA]/80 leading-relaxed max-w-2xl">
              {(t.about as Record<string, string>).text}
            </p>
            
            {/* Additional cosmic elements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center space-x-2 text-[#FFD700]/60 pt-4"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-1 h-1 bg-[#FFD700] rounded-full"
                />
              ))}
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="order-1 md:order-2 flex justify-center"
          >
            <div className="relative max-w-xs xs:max-w-sm mx-auto flex justify-center">
              <motion.div
                className="w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 bg-gradient-to-br from-[#191970]/30 to-[#0A0A23]/30 rounded-full border border-[#C0C0C0]/20 p-1.5 xs:p-2 sm:p-3 cosmic-glow relative overflow-hidden flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Inner rotating ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border border-[#FFD700]/10 rounded-full"
                />
                
                <div className="w-full h-full rounded-full overflow-hidden border-1 xs:border-2 border-[#FFD700]/30 relative z-10 flex items-center justify-center image-container">
                  {isImageLoading ? (
                    <div className="w-full h-full bg-[#191970]/30 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full"
                      />
                    </div>
                  ) : (
                    <Image
                      src={profileImage}
                      alt="José Garfias - Cosmic Navigator and Astrologer"
                      fill
                      className="object-cover object-center rounded-full"
                      style={{
                        objectPosition: 'center 20%'
                      }}
                      onError={() => {
                        console.error('Profile image failed to load, using fallback');
                      }}
                    />
                  )}
                </div>
                
                {/* Cosmic overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#191970]/20 to-transparent rounded-full pointer-events-none" />
              </motion.div>
              
              {/* Enhanced decorative cosmic elements around the photo */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#FFD700] rounded-full absolute top-8 sm:top-12 right-8 sm:right-12 opacity-70 cosmic-glow-small"></div>
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#C0C0C0] rounded-full absolute bottom-12 sm:bottom-16 left-4 sm:left-8 opacity-80"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#FFD700] rounded-full absolute top-16 sm:top-20 left-8 sm:left-12 opacity-60"></div>
                <div className="w-1 h-1 bg-[#C0C0C0] rounded-full absolute top-1/3 right-4 sm:right-8 opacity-50"></div>
                <div className="w-1.5 h-1.5 bg-[#FFD700] rounded-full absolute bottom-1/3 right-12 sm:right-16 opacity-40"></div>
              </motion.div>
              
              {/* Floating particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-0.5 sm:w-1 sm:h-1 bg-[#FFD700] rounded-full opacity-40"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    x: [0, 15, -15, 0],
                    y: [0, -20, 15, 0],
                    opacity: [0.2, 0.8, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 6 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
    </>
  );
}
