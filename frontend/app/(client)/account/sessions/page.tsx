'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ClockIcon, PackageIcon, ShoppingCart } from 'lucide-react';

import SessionReportButton from './SessionReportButton';

interface Session {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  package: {
    name: string;
    duration_minutes: number;
  };
  created_at: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/my-bookings');
      const result = await response.json();
      
      if (result.success) {
        setSessions(result.data);
      } else {
        console.error('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Your Sessions</h1>
        <p className="text-gray-400 mt-2">View your spiritual consultation history</p>
      </div>

      {sessions.length === 0 ? (
        <Card className="bg-[#1a1a2e] border-[#16213e] text-white">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <CalendarIcon className="w-16 h-16 text-gray-500 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-300">No Sessions Yet</h3>
              <p className="text-gray-400">
                You haven&apos;t booked any sessions yet. Start your spiritual journey today!
              </p>
              <Button className="bg-[#ffd700] text-black hover:bg-[#ffd700]/90">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Book Your First Session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="bg-[#1a1a2e] border-[#16213e] text-white">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <PackageIcon className="w-5 h-5 text-[#ffd700]" />
                    <CardTitle className="text-lg">{session.package.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <ClockIcon className="w-4 h-4" />
                    <span>{session.start_time} - {session.end_time}</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Duration: {session.package.duration_minutes} minutes
                  </div>
                </div>

                {session.notes && (
                  <div className="bg-[#16213e] p-3 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Notes:</span> {session.notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Booked on: {new Date(session.created_at).toLocaleDateString()}
                  </div>
                  
                  {session.status === 'completed' && (
                    <SessionReportButton bookingId={session.id} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
