import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { App } from '@/components/App';

// ISR Configuration - This page will be statically generated and revalidated
export const revalidate = 3600; // Revalidate every hour

export default function HomePage() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
