'use client';

import { useState, useEffect } from 'react';

interface LogoSettings {
  id: number;
  type: 'text' | 'image';
  text: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useLogo() {
  const [logoSettings, setLogoSettings] = useState<LogoSettings>({
    id: 1,
    type: 'text',
    text: 'SOULPATH',
    imageUrl: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        console.log('Loading logo settings...');
        const response = await fetch('/api/logo');
        
        if (response.ok) {
          const data = await response.json();
          if (data.logoSettings) {
            console.log('Logo settings loaded successfully:', data.logoSettings);
            setLogoSettings(data.logoSettings);
          }
        } else {
          console.log(`Logo endpoint returned ${response.status} - using default logo settings`);
        }
      } catch (error) {
        console.log('Logo loading failed, using default settings:', error);
        // Use default settings on any error
      } finally {
        setIsLoading(false);
      }
    };

    loadLogo();
  }, []);

  const updateLogoSettings = async (newSettings: Partial<LogoSettings>) => {
    try {
      const response = await fetch('/api/logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...logoSettings,
          ...newSettings,
          updatedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLogoSettings(data.logoSettings);
        return { success: true, data: data.logoSettings };
      } else {
        throw new Error('Failed to update logo settings');
      }
    } catch (error) {
      console.error('Error updating logo settings:', error);
      return { success: false, error };
    }
  };

  const reloadLogoSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/logo');
      if (response.ok) {
        const data = await response.json();
        if (data.logoSettings) {
          setLogoSettings(data.logoSettings);
        }
      }
    } catch (error) {
      console.error('Error reloading logo settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { logoSettings, isLoading, updateLogoSettings, reloadLogoSettings };
}
