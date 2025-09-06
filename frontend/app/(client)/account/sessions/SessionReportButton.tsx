'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';

interface SessionReportButtonProps {
  bookingId: number;
}

export default function SessionReportButton({ bookingId }: SessionReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/client/bookings/${bookingId}/report`);
      const data = await response.json();
      
      if (data.success && data.data.downloadUrl) {
        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.data.downloadUrl;
        link.download = `session-report-${bookingId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('Failed to get download URL:', data.message);
        alert('Failed to download report. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      className="bg-[#ffd700] text-[#0a0a23] hover:bg-[#e6c200] disabled:opacity-50"
    >
      <DownloadIcon className="mr-2 h-4 w-4" />
      {isLoading ? 'Downloading...' : 'Download Report'}
    </Button>
  );
}
