'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, Users, DollarSign, Calendar } from 'lucide-react';

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  sessionsCount: number;
  duration: number;
  isPopular?: boolean;
  packageType?: string;
  maxGroupSize?: number;
}

interface PackageDisplayProps {
  packages: Package[];
  onPackageSelect?: (selectedPackage: Package) => void;
  className?: string;
}

export function PackageDisplay({ packages, onPackageSelect, className = '' }: PackageDisplayProps) {
  if (!packages || packages.length === 0) {
    return (
      <div className={`p-4 text-center text-[#C0C0C0] ${className}`}>
        <p>No hay paquetes disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-[#FFD700] font-medium text-sm mb-3">
        🌟 Paquetes de Astrología Disponibles
      </div>
      
      {packages.map((pkg, index) => (
        <motion.div
          key={pkg.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-[#1a1a2e] border border-[#FFD700]/20 rounded-lg p-3 hover:border-[#FFD700]/40 transition-colors duration-200"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-[#FFD700] font-medium text-sm">
                {pkg.name}
              </h3>
              {pkg.isPopular && (
                <div className="flex items-center space-x-1 text-yellow-400">
                  <Star size={12} />
                  <span className="text-xs">POPULAR</span>
                </div>
              )}
            </div>
            <div className="text-[#FFD700] font-bold text-sm">
              {pkg.currency}{pkg.price.toFixed(0)}
            </div>
          </div>
          
          <p className="text-[#C0C0C0] text-xs mb-3 leading-relaxed">
            {pkg.description}
          </p>
          
          <div className="flex items-center space-x-4 text-[#A0A0A0] text-xs">
            <div className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{pkg.sessionsCount} sesión{pkg.sessionsCount !== 1 ? 'es' : ''}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={12} />
              <span>{pkg.duration} min</span>
            </div>
            {pkg.maxGroupSize && pkg.maxGroupSize > 1 && (
              <div className="flex items-center space-x-1">
                <Users size={12} />
                <span>Hasta {pkg.maxGroupSize}</span>
              </div>
            )}
          </div>
          
          {onPackageSelect && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPackageSelect(pkg)}
              className="w-full mt-3 bg-[#FFD700] text-[#0A0A23] py-2 px-3 rounded-md text-xs font-medium hover:bg-[#FFD700]/90 transition-colors duration-200"
            >
              Seleccionar Paquete
            </motion.button>
          )}
        </motion.div>
      ))}
      
      <div className="text-center text-[#C0C0C0] text-xs mt-4">
        💫 ¿Listo para reservar? Solo dime qué paquete te interesa y te ayudo a comenzar.
      </div>
    </div>
  );
}

// Helper function to parse packages from text response
export function parsePackagesFromText(text: string): Package[] {
  const packages: Package[] = [];
  
  // Look for package patterns in the text
  const packageRegex = /\*\*(\d+)\.\s*([^*]+)\*\*([^*]*)\n\s*💰\s*Precio:\s*([^\n]+)\n\s*📅\s*Sesiones:\s*(\d+)\n\s*⏱️\s*Duración:\s*(\d+)\s*minutos?\s*cada\s*una?\n\s*📝\s*([^\n]+)/g;
  
  let match;
  while ((match = packageRegex.exec(text)) !== null) {
    const [, index, name, popularBadge, priceText, sessions, duration, description] = match;
    
    // Extract price and currency
    const priceMatch = priceText.match(/([^\d]*)(\d+)/);
    const currency = priceMatch ? priceMatch[1].trim() : '$';
    const price = priceMatch ? parseFloat(priceMatch[2]) : 0;
    
    packages.push({
      id: parseInt(index),
      name: name.trim(),
      description: description.trim(),
      price: price,
      currency: currency,
      sessionsCount: parseInt(sessions),
      duration: parseInt(duration),
      isPopular: popularBadge.includes('⭐') || popularBadge.includes('POPULAR'),
      packageType: 'Standard',
      maxGroupSize: 1
    });
  }
  
  return packages;
}
