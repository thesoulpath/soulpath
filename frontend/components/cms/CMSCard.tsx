import React from 'react';
import { motion } from 'framer-motion';

interface CMSCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerActions?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const CMSCard: React.FC<CMSCardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  headerActions,
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  
  const cardClasses = `bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl shadow-lg ${className}`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cardClasses}
    >
      {(title || headerActions) && (
        <div className="px-6 py-4 border-b border-[#2A2A3E]">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-[#EAEAEA]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-[#9CA3AF] mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {headerActions}
              {collapsible && (
                <motion.button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 hover:bg-[#2A2A3E] rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ rotate: isCollapsed ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[#9CA3AF]">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <motion.div
        initial={false}
        animate={{ height: isCollapsed ? 0 : 'auto' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};
