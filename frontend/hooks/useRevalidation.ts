import { useCallback } from 'react';

interface RevalidationOptions {
  path?: string;
  secret?: string;
}

export const useRevalidation = () => {
  const revalidatePath = useCallback(async (options: RevalidationOptions = {}) => {
    try {
      const { path = '/', secret = process.env.NEXT_PUBLIC_REVALIDATION_SECRET } = options;
      
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, secret }),
      });

      if (!response.ok) {
        throw new Error(`Revalidation failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Path revalidated:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Revalidation error:', error);
      throw error;
    }
  }, []);

  const revalidateHome = useCallback(() => revalidatePath({ path: '/' }), [revalidatePath]);
  const revalidateAdmin = useCallback(() => revalidatePath({ path: '/admin' }), [revalidatePath]);
  const revalidateContent = useCallback(() => revalidatePath({ path: '/api/content' }), [revalidatePath]);

  return {
    revalidatePath,
    revalidateHome,
    revalidateAdmin,
    revalidateContent,
  };
};
