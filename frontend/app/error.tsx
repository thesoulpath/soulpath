'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function Error({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }; 
  reset: () => void 
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white">
      <div className="relative">
        {/* Constellation background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] opacity-50" />
        
        {/* Error content */}
        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-red-400" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4 text-[#FFD700]">Oops! Something went wrong</h2>
          
          <p className="text-[#C0C0C0] mb-8 leading-relaxed">
            We encountered an unexpected error while loading your page. 
            This might be a temporary issue that will resolve itself.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-[#FFD700] mb-2">Error Details</summary>
              <pre className="bg-[#1a1a2e] p-4 rounded-lg text-sm text-red-400 overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => reset()} 
              className="bg-[#FFD700] text-[#0a0a0a] hover:bg-[#FFA500] transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#0a0a0a] transition-colors"
            >
              <Home size={16} className="mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
