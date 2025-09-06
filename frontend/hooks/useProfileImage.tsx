'use client';

import { useState, useEffect } from 'react';

export function useProfileImage(initialImage?: string) {
  const [profileImage, setProfileImage] = useState(initialImage || '/assets/cf4f95a6cc4d03023c0e98479a93fe16d4ef06f2.png');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch profile image from backend CMS
  const fetchProfileImage = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/images');
      
      if (response.ok) {
        const result = await response.json();
        if (result.images?.profileImage) {
          setProfileImage(result.images.profileImage);
        }
      } else {
        console.warn('Failed to fetch profile image from backend, using default');
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile image when initialImage changes
  useEffect(() => {
    if (initialImage) {
      setProfileImage(initialImage);
    } else {
      // If no initial image provided, fetch from backend
      fetchProfileImage();
    }
  }, [initialImage]);

  const updateProfileImage = async (newImage: string) => {
    try {
      setIsLoading(true);
      
      // Update profile image via API
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileImage: newImage
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setProfileImage(result.images?.profileImage || newImage);
        return { success: true, data: result.images };
      } else {
        throw new Error('Failed to update profile image');
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const reloadProfileImage = () => {
    fetchProfileImage();
  };

  return { profileImage, updateProfileImage, isLoading, reloadProfileImage };
}