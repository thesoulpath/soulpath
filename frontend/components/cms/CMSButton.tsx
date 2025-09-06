import React from 'react';
import { motion } from 'framer-motion';

interface CMSButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const CMSButton: React.FC<CMSButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-[#FFD700] text-[#0A0A23] hover:bg-[#FFD700]/90 focus:ring-[#FFD700]/50 shadow-lg',
    secondary: 'bg-[#1A1A2E] text-[#EAEAEA] hover:bg-[#1A1A2E]/80 focus:ring-[#1A1A2E]/50 border border-[#2A2A3E]',
    outline: 'bg-transparent text-[#EAEAEA] hover:bg-[#1A1A2E] focus:ring-[#1A1A2E]/50 border border-[#2A2A3E]',
    danger: 'bg-[#DC2626] text-white hover:bg-[#DC2626]/90 focus:ring-[#DC2626]/50',
    success: 'bg-[#059669] text-white hover:bg-[#059669]/90 focus:ring-[#059669]/50'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
    </motion.button>
  );
};
