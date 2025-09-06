'use client';

import React, { useState, useEffect } from 'react';
import { defaultTranslations } from '@/lib/data/translations';

export function useLanguage() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  useEffect(() => {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguage(savedLanguage as 'en' | 'es');
    }
  }, []);

  const changeLanguage = React.useCallback((newLanguage: 'en' | 'es') => {
    console.log('🔄 Changing language from', language, 'to', newLanguage);
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    console.log('💾 Language saved to localStorage:', newLanguage);
  }, [language]);

  return { language, setLanguage: changeLanguage };
}

export function useTranslations(initialContent?: any, language?: 'en' | 'es') {
  const [content, setContent] = useState(initialContent || defaultTranslations);
  const [isLoading, setIsLoading] = useState(false); // Changed from true to false
  
  // Use provided language or fallback to default
  const currentLanguage = language || 'en';

  // Fetch translations from backend CMS
  const fetchTranslations = async () => {
    try {
      // Don't set loading state for background fetch
      // Add cache-busting parameter to ensure fresh content
      const response = await fetch(`/api/content?t=${Date.now()}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.content && Object.keys(result.content).length > 0) {
          console.log('🔍 API returned content:', result.content);
          console.log('🔍 Default translations keys:', Object.keys(defaultTranslations.en));
          
          // Ensure we always have the default structure, then update with API content
          const mergedContent = {
            en: { ...defaultTranslations.en },
            es: { ...defaultTranslations.es }
          };
          
          // Update specific keys from API content
          if (result.content.en) {
            Object.keys(result.content.en).forEach(key => {
              if (result.content.en[key] && typeof result.content.en[key] === 'object') {
                mergedContent.en[key as keyof typeof mergedContent.en] = { 
                  ...mergedContent.en[key as keyof typeof mergedContent.en], 
                  ...result.content.en[key] 
                };
              } else {
                mergedContent.en[key as keyof typeof mergedContent.en] = result.content.en[key];
              }
            });
          }
          
          if (result.content.es) {
            Object.keys(result.content.es).forEach(key => {
              if (result.content.es[key] && typeof result.content.es[key] === 'object') {
                mergedContent.es[key as keyof typeof mergedContent.es] = { 
                  ...mergedContent.es[key as keyof typeof mergedContent.es], 
                  ...result.content.es[key] 
                };
              } else {
                mergedContent.es[key as keyof typeof mergedContent.es] = result.content.es[key];
              }
            });
          }
          
          console.log('🔍 Merged content keys:', Object.keys(mergedContent.en));
          console.log('🔍 Merged nav keys:', Object.keys(mergedContent.en.nav || {}));
          
          setContent(mergedContent);
        } else {
          // Fallback to defaults if backend returns empty content
          console.log('🔍 Using default translations (no API content)');
          // Don't update content if we already have defaults
        }
      } else {
        console.warn('Failed to fetch translations from backend, using defaults');
        // Don't update content if we already have defaults
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
      // Don't update content if we already have defaults
    }
  };

  // Single useEffect to handle content initialization and language changes
  useEffect(() => {
    console.log(`🔄 useEffect triggered - initialContent:`, !!initialContent, 'language:', currentLanguage);
    
    // Only set initial content if it's provided and valid
    if (initialContent && Object.keys(initialContent).length > 0) {
      console.log('✅ Using initial content for language:', currentLanguage);
      setContent(initialContent);
    } else {
      // Ensure we have default translations first
      setContent(defaultTranslations);
      // Then fetch from backend in the background
      console.log('🔄 Fetching fresh content from backend for language:', currentLanguage);
      fetchTranslations();
    }
  }, [initialContent, currentLanguage]); // Only depend on these two values

  const updateContent = async (newContent: any) => {
    try {
      setIsLoading(true);
      
      // Update content via API
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContent),
      });

      if (response.ok) {
        const result = await response.json();
        setContent(result.content);
        return { success: true, data: result.content };
      } else {
        throw new Error('Failed to update content');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const reloadTranslations = () => {
    fetchTranslations();
  };

  // Get the current language translations, fallback to English if current language not found
  const t = (content?.[currentLanguage as keyof typeof content] || content?.en || defaultTranslations[currentLanguage as keyof typeof defaultTranslations] || defaultTranslations.en);

  return { t, updateContent, isLoading, content, reloadTranslations };
}