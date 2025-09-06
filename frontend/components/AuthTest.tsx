'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export function AuthTest() {
  const { user, isLoading, isAdmin } = useAuth();

  const testAuth = async () => {
    if (!user?.access_token) {
      console.log('❌ No access token available');
      return;
    }

    try {
      const response = await fetch('/api/admin/users?enhanced=true', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Test response status:', response.status);
      console.log('🔍 Test response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Test successful:', data);
      } else {
        const errorText = await response.text();
        console.error('❌ Test failed:', response.status, response.statusText);
        console.error('❌ Error body:', errorText);
      }
    } catch (error) {
      console.error('❌ Test error:', error);
    }
  };

  if (isLoading) {
    return <div>Loading auth...</div>;
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-white font-bold mb-4">Authentication Test</h3>
      
      <div className="space-y-2 text-sm">
        <p className="text-gray-300">
          <span className="font-medium">User:</span> {user?.email || 'Not logged in'}
        </p>
        <p className="text-gray-300">
          <span className="font-medium">Admin:</span> {isAdmin ? 'Yes' : 'No'}
        </p>
        <p className="text-gray-300">
          <span className="font-medium">Token:</span> {user?.access_token ? `${user.access_token.substring(0, 20)}...` : 'None'}
        </p>
        <p className="text-gray-300">
          <span className="font-medium">Token Length:</span> {user?.access_token?.length || 0}
        </p>
      </div>

      <button
        onClick={testAuth}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={!user?.access_token}
      >
        Test API Call
      </button>
    </div>
  );
}
