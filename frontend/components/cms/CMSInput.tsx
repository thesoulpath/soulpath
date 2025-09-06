import React from 'react';
import { motion } from 'framer-motion';

interface CMSInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'url';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  rows?: number;
  multiline?: boolean;
}

export const CMSInput: React.FC<CMSInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  error,
  className = '',
  rows = 3,
  multiline = false
}) => {
  const baseClasses = 'w-full px-4 py-3 bg-[#1A1A2E] border border-[#2A2A3E] rounded-lg text-[#EAEAEA] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const errorClasses = error ? 'border-[#DC2626] focus:ring-[#DC2626]/50 focus:border-[#DC2626]' : '';
  
  const classes = `${baseClasses} ${errorClasses} ${className}`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {label && (
        <label className="block text-sm font-medium text-[#EAEAEA]">
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}
      
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={classes}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={classes}
        />
      )}
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-[#DC2626]"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};
