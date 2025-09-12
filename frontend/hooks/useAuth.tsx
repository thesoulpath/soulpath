import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  access_token: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Admin email list - can be extended for multiple admin users
  const ADMIN_EMAILS = [
    'admin@soulpath.lat',
    'coco@soulpath.lat',
    'admin@matmax.world',
    'alberto@matmax.world'
  ];

  // Calculate isAdmin reactively
  const isAdmin = Boolean(user?.email && (ADMIN_EMAILS.includes(user.email) || user.role === 'admin'));
  
  useEffect(() => {
    // Check for existing token in localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // Verify token with our API
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const userData = {
            ...data.user,
            access_token: token
          };
          console.log('🔐 useAuth: User authenticated from token:', userData);
          setUser(userData);
        } else {
          console.log('🔐 useAuth: Invalid token, clearing storage');
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      })
      .catch(error => {
        console.error('🔐 useAuth: Token verification error:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else {
      console.log('🔐 useAuth: No token found');
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 useAuth: Attempting sign in for:', email);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('auth_token', data.user.access_token);
        
        console.log('🔐 useAuth: Sign in successful:', data.user);
        setUser(data.user);
        
        return { data, error: null };
      } else {
        console.error('🔐 useAuth: Sign in error:', data.error);
        return { data: null, error: { message: data.message } };
      }
    } catch (error) {
      console.error('🔐 useAuth: Sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    console.log('🔐 useAuth: Signing out');
    
    // Remove token from localStorage
    localStorage.removeItem('auth_token');
    setUser(null);
    
    return { error: null };
  };

  console.log('🔐 useAuth: Current state:', {
    user: user ? 'authenticated' : null,
    userEmail: user?.email || 'none',
    isAdmin,
    isLoading
  });

  return {
    user,
    isLoading,
    signIn,
    signOut,
    isAdmin
  };
}