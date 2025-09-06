import React from 'react';
import { motion } from 'framer-motion';

interface CMSTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface CMSTabsProps {
  tabs: CMSTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const CMSTabs: React.FC<CMSTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {

  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-[#2A2A3E]">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative py-4 px-1 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'text-[#FFD700]'
                  : 'text-[#9CA3AF] hover:text-[#EAEAEA]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2">
                {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                <span>{tab.label}</span>
              </div>
              
              {/* Active indicator */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="min-h-[400px]"
      >
        {tabs.find(tab => tab.id === activeTab)?.content}
      </motion.div>
    </div>
  );
};
