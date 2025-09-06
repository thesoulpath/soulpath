'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export function ConstellationBackground() {
  // Generate star data with consistent positioning
  const generateStars = (count: number, type: 'small' | 'medium' | 'large' | 'cosmic') => {
    return [...Array(count)].map((_, i) => {
      const seed = i * 1000 + (type === 'small' ? 0 : type === 'medium' ? 100 : type === 'large' ? 200 : 250);
      const random = (min: number, max: number) => {
        const x = Math.sin(seed) * 10000;
        const result = min + (x - Math.floor(x)) * (max - min);
        // Round to 4 decimal places to ensure consistency between server and client
        return Math.round(result * 10000) / 10000;
      };

      return {
        id: i,
        x: random(0, 100),
        y: random(0, 100),
        size: type === 'small' ? random(1, 3) : type === 'medium' ? random(3, 6) : type === 'large' ? random(6, 10) : random(10, 15),
        brightness: random(0.3, 1),
        speed: random(0.5, 2),
        direction: random(0, 360),
        pulseDuration: random(2, 6),
        delay: random(0, 5),
        type
      };
    });
  };

  // Generate orbital particles
  const generateOrbitals = (count: number) => {
    return [...Array(count)].map((_, i) => {
      const seed = i * 1000 + 100;
      const random = (min: number, max: number) => {
        const x = Math.sin(seed) * 10000;
        const result = min + (x - Math.floor(x)) * (max - min);
        // Round to 4 decimal places to ensure consistency between server and client
        return Math.round(result * 10000) / 10000;
      };

      return {
        id: i,
        centerX: random(20, 80),
        centerY: random(20, 80),
        radius: random(15, 40),
        speed: random(0.5, 2),
        startAngle: random(0, 360),
        size: random(2, 6),
        opacity: random(0.3, 0.8),
        color: `hsl(${random(200, 280)}, 70%, 60%)`
      };
    });
  };

  // Generate shooting stars
  const generateShootingStars = (count: number) => {
    return [...Array(count)].map((_, i) => {
      const seed = i * 1000 + 200;
      const random = (min: number, max: number) => {
        const x = Math.sin(seed) * 10000;
        const result = min + (x - Math.floor(x)) * (max - min);
        // Round to 4 decimal places to ensure consistency between server and client
        return Math.round(result * 10000) / 10000;
      };

      return {
        id: i,
        startX: random(0, 100),
        startY: random(0, 100),
        endX: random(0, 100),
        endY: random(0, 100),
        duration: random(3, 8),
        delay: random(0, 10),
        size: random(2, 5)
      };
    });
  };

  // Use useMemo to prevent regeneration on every render
  const smallStars = useMemo(() => generateStars(60, 'small'), []);
  const mediumStars = useMemo(() => generateStars(25, 'medium'), []);
  const largeStars = useMemo(() => generateStars(12, 'large'), []);
  const cosmicStars = useMemo(() => generateStars(8, 'cosmic'), []);

  const orbitals = useMemo(() => generateOrbitals(15), []);
  const shootingStars = useMemo(() => generateShootingStars(6), []);

  // Pre-calculate nebula data
  const nebulaData = useMemo(() => {
    return [...Array(8)].map((_, i) => {
      const seed = i * 1000 + 300;
      const random = (min: number, max: number) => {
        const x = Math.sin(seed) * 10000;
        const result = min + (x - Math.floor(x)) * (max - min);
        // Round to 4 decimal places to ensure consistency between server and client
        return Math.round(result * 10000) / 10000;
      };

      return {
        id: i,
        x: random(0, 100),
        y: random(0, 100),
        width: random(20, 60),
        height: random(20, 60),
        duration: random(8, 15)
      };
    });
  }, []);

  // Pre-calculate trail data
  const trailData = useMemo(() => {
    return [...Array(12)].map((_, i) => {
      const seed = i * 1000 + 400;
      const random = (min: number, max: number) => {
        const x = Math.sin(seed) * 10000;
        const result = min + (x - Math.floor(x)) * (max - min);
        // Round to 4 decimal places to ensure consistency between server and client
        return Math.round(result * 10000) / 10000;
      };

      return {
        id: i,
        x: random(0, 100),
        y: random(0, 100),
        duration: random(5, 12)
      };
    });
  }, []);

  // Pre-calculate interactive particle data
  const interactiveData = useMemo(() => {
    return [...Array(20)].map((_, i) => {
      const seed = i * 1000 + 500;
      const random = (min: number, max: number) => {
        const x = Math.sin(seed) * 10000;
        const result = min + (x - Math.floor(x)) * (max - min);
        // Round to 4 decimal places to ensure consistency between server and client
        return Math.round(result * 10000) / 10000;
      };

      return {
        id: i,
        x: random(0, 100),
        y: random(0, 100),
        size: random(3, 8),
        color: `hsl(${random(200, 280)}, 70%, 60%)`,
        shadowSize: random(10, 25),
        duration: random(3, 8)
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Layer 1: Small twinkling stars */}
      <div className="absolute inset-0 opacity-15">
        {smallStars.map((star) => (
          <motion.div
            key={`small-${star.id}`}
            className="absolute bg-white rounded-full"
            style={{
              left: `${Math.round(star.x * 100) / 100}%`,
              top: `${Math.round(star.y * 100) / 100}%`,
              width: `${Math.round(star.size * 100) / 100}px`,
              height: `${Math.round(star.size * 100) / 100}px`,
            }}
            animate={{
              opacity: [star.brightness * 0.3, star.brightness, star.brightness * 0.3],
              scale: [0.8, 1.3, 0.8],
              x: [0, Math.sin(star.direction) * 5, 0],
              y: [0, Math.cos(star.direction) * 3, 0],
            }}
            transition={{
              duration: star.pulseDuration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Layer 2: Medium stars with gentle drift */}
      <div className="absolute inset-0 opacity-25">
        {mediumStars.map((star) => (
          <motion.div
            key={`medium-${star.id}`}
            className="absolute bg-white rounded-full shadow-sm"
            style={{
              left: `${Math.round(star.x * 100) / 100}%`,
              top: `${Math.round(star.y * 100) / 100}%`,
              width: `${Math.round(star.size * 100) / 100}px`,
              height: `${Math.round(star.size * 100) / 100}px`,
              filter: 'blur(0.5px)',
            }}
            animate={{
              opacity: [star.brightness * 0.2, star.brightness * 0.8, star.brightness * 0.2],
              scale: [1, 1.4, 1],
              x: [0, Math.sin(star.direction) * 8, Math.sin(star.direction + 90) * 4, 0],
              y: [0, Math.cos(star.direction) * 6, Math.cos(star.direction + 90) * 3, 0],
            }}
            transition={{
              duration: star.pulseDuration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Layer 3: Large stars with golden glow */}
      <div className="absolute inset-0 opacity-35">
        {largeStars.map((star) => {
          const isGolden = (star.id % 5) === 0; // Deterministic golden star generation
          return (
            <motion.div
              key={`large-${star.id}`}
              className="absolute rounded-full"
              style={{
                left: `${Math.round(star.x * 100) / 100}%`,
                top: `${Math.round(star.y * 100) / 100}%`,
                width: `${Math.round(star.size * 100) / 100}px`,
                height: `${Math.round(star.size * 100) / 100}px`,
                background: isGolden ? '#FFD700' : '#FFFFFF',
                boxShadow: `0 0 ${Math.round(star.size * 2 * 100) / 100}px rgba(255, 215, 0, 0.3)`,
                filter: 'blur(0.5px)',
              }}
              animate={{
                opacity: [star.brightness * 0.4, star.brightness, star.brightness * 0.4],
                scale: [1, 1.6, 1],
                x: [0, Math.sin(star.direction) * 12, Math.sin(star.direction + 180) * 6, 0],
                y: [0, Math.cos(star.direction) * 10, Math.cos(star.direction + 180) * 5, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: star.pulseDuration,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </div>

      {/* Layer 4: Cosmic dust particles */}
      <div className="absolute inset-0 opacity-20">
        {cosmicStars.map((star) => (
          <motion.div
            key={`cosmic-${star.id}`}
            className="absolute rounded-full"
            style={{
              left: `${Math.round(star.x * 100) / 100}%`,
              top: `${Math.round(star.y * 100) / 100}%`,
              width: `${Math.round(star.size * 100) / 100}px`,
              height: `${Math.round(star.size * 100) / 100}px`,
              background: 'radial-gradient(circle, #FFD700 0%, rgba(255, 215, 0, 0.3) 70%, transparent 100%)',
              filter: 'blur(1px)',
            }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              scale: [0.5, 2, 0.5],
              x: [0, Math.sin(star.direction) * 20, Math.sin(star.direction + 120) * 15, Math.sin(star.direction + 240) * 10, 0],
              y: [0, Math.cos(star.direction) * 15, Math.cos(star.direction + 120) * 12, Math.cos(star.direction + 240) * 8, 0],
            }}
            transition={{
              duration: star.pulseDuration * 1.5,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Layer 5: Orbital particles */}
      <div className="absolute inset-0 opacity-10">
        {orbitals.map((orbital) => (
          <motion.div
            key={`orbital-${orbital.id}`}
            className="absolute rounded-full"
            style={{
              width: `${Math.round(orbital.size * 100) / 100}px`,
              height: `${Math.round(orbital.size * 100) / 100}px`,
              background: orbital.color,
              boxShadow: `0 0 ${Math.round(orbital.size * 2 * 100) / 100}px ${orbital.color}`,
            }}
            animate={{
              x: [
                Math.round((orbital.centerX + orbital.radius * Math.cos((orbital.startAngle * Math.PI) / 180)) * 100) / 100,
                Math.round((orbital.centerX + orbital.radius * Math.cos(((orbital.startAngle + 90) * Math.PI) / 180)) * 100) / 100,
                Math.round((orbital.centerX + orbital.radius * Math.cos(((orbital.startAngle + 180) * Math.PI) / 180)) * 100) / 100,
                Math.round((orbital.centerX + orbital.radius * Math.cos(((orbital.startAngle + 270) * Math.PI) / 180)) * 100) / 100,
                Math.round((orbital.centerX + orbital.radius * Math.cos((orbital.startAngle * Math.PI) / 180)) * 100) / 100,
              ],
              y: [
                Math.round((orbital.centerY + orbital.radius * Math.sin((orbital.startAngle * Math.PI) / 180)) * 100) / 100,
                Math.round((orbital.centerY + orbital.radius * Math.sin(((orbital.startAngle + 90) * Math.PI) / 180)) * 100) / 100,
                Math.round((orbital.centerY + orbital.radius * Math.sin(((orbital.startAngle + 180) * Math.PI) / 180)) * 100) / 100,
                Math.round((orbital.centerY + orbital.radius * Math.sin(((orbital.startAngle + 270) * Math.PI) / 180)) * 100) / 100,
                Math.round((orbital.centerY + orbital.radius * Math.sin((orbital.startAngle * Math.PI) / 180)) * 100) / 100,
              ],
              opacity: [orbital.opacity * 0.3, orbital.opacity, orbital.opacity * 0.3],
            }}
            transition={{
              duration: 15 + orbital.speed * 10,
              repeat: Infinity,
              ease: "linear",
              delay: orbital.id * 0.5,
            }}
          />
        ))}
      </div>

      {/* Layer 6: Shooting stars */}
      <div className="absolute inset-0 opacity-40">
        {shootingStars.map((star) => (
          <motion.div
            key={`shooting-${star.id}`}
            className="absolute"
            style={{
              left: `${star.startX}%`,
              top: `${star.startY}%`,
            }}
            animate={{
              x: [`0%`, `${star.endX - star.startX}%`],
              y: [`0%`, `${star.endY - star.startY}%`],
              opacity: [0, 1, 0.8, 0],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeOut",
              repeatDelay: 10 + (star.id % 10), // Deterministic repeatDelay
            }}
          >
            <div
              className="w-1 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full"
              style={{
                width: `${Math.round((20 + star.size * 10) * 100) / 100}px`,
                height: `${Math.round(star.size * 100) / 100}px`,
                boxShadow: `0 0 ${Math.round(star.size * 3 * 100) / 100}px rgba(255, 255, 255, 0.6)`,
                filter: 'blur(0.5px)',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Layer 7: Nebula clouds */}
      <div className="absolute inset-0 opacity-5">
        {nebulaData.map((nebula) => (
          <motion.div
            key={`nebula-${nebula.id}`}
            className="absolute rounded-full"
            style={{
              left: `${nebula.x}%`,
              top: `${nebula.y}%`,
              width: `${nebula.width}px`,
              height: `${nebula.height}px`,
              background: `radial-gradient(ellipse, 
                rgba(255, 215, 0, 0.1) 0%, 
                rgba(192, 192, 192, 0.05) 30%, 
                rgba(25, 25, 112, 0.03) 60%, 
                transparent 100%)`,
              filter: 'blur(3px)',
            }}
            animate={{
              scale: [1, 1.2, 0.9, 1],
              opacity: [0.3, 0.6, 0.4, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: nebula.duration,
              repeat: Infinity,
              delay: nebula.id * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Layer 8: Particle trails */}
      <div className="absolute inset-0 opacity-8">
        {trailData.map((trail) => (
          <motion.div
            key={`trail-${trail.id}`}
            className="absolute"
            style={{
              left: `${trail.x}%`,
              top: `${trail.y}%`,
            }}
          >
            {[...Array(5)].map((_, j) => (
              <motion.div
                key={j}
                className="absolute w-0.5 h-0.5 bg-white rounded-full"
                style={{
                  left: `${j * 3}px`,
                  top: `${j * 2}px`,
                }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1, 0.5],
                  x: [0, Math.sin(trail.id * 30) * 15, 0],
                  y: [0, Math.cos(trail.id * 30) * 10, 0],
                }}
                transition={{
                  duration: trail.duration,
                  repeat: Infinity,
                  delay: j * 0.3 + trail.id * 0.5,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* Layer 9: Interactive cosmic particles that respond to scroll */}
      <div className="absolute inset-0 opacity-15">
        {interactiveData.map((particle) => (
          <motion.div
            key={`interactive-${particle.id}`}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              boxShadow: `0 0 ${particle.shadowSize}px rgba(255, 215, 0, 0.4)`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.5, 0.8],
              x: [0, Math.sin(particle.id * 45) * 10, Math.sin(particle.id * 90) * 15, 0],
              y: [0, Math.cos(particle.id * 45) * 8, Math.cos(particle.id * 90) * 12, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.id * 0.2,
              ease: "easeInOut"
            }}
            whileHover={{
              scale: 2,
              opacity: 1,
              transition: { duration: 0.3 }
            }}
          />
        ))}
      </div>
    </div>
  );
}
