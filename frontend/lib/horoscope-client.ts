import { useEffect, useState } from 'react';

let Ephemeris: any = null;
let isInitialized = false;

export const useHoroscope = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initEphemeris = async () => {
      if (isInitialized) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          throw new Error('Ephemeris can only be used in browser environment');
        }

        // Dynamic import with error handling
        const ephemerisModule = await import('ephemeris').catch((err) => {
          console.error('Failed to import ephemeris:', err);
          throw new Error('Failed to load Ephemeris library');
        });

        Ephemeris = ephemerisModule.default || ephemerisModule;
        isInitialized = true;
        setIsLoading(false);
      } catch (err) {
        console.error('Ephemeris initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Ephemeris');
        setIsLoading(false);
      }
    };

    initEphemeris();
  }, []);

  return { Ephemeris, isLoading, error };
};

export const getEphemeris = () => {
  if (!isInitialized) {
    throw new Error('Ephemeris not initialized. Use useHoroscope hook first.');
  }
  return Ephemeris;
};
