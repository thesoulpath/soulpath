'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, Users, Mic, MicOff, VideoIcon, VideoOff, PhoneOff, Settings, Share2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface LiveSessionConfig {
  id: string;
  name: string;
  provider: 'zoom' | 'meet' | 'teams' | 'custom';
  apiKey: string;
  meetingId?: string;
  meetingUrl?: string;
  isActive: boolean;
  settings: {
    allowVideo: boolean;
    allowAudio: boolean;
    allowChat: boolean;
    allowScreenShare: boolean;
    maxParticipants: number;
    recordingEnabled: boolean;
  };
}

interface UpcomingSession {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'live' | 'ended';
  meetingUrl?: string;
  meetingId?: string;
  participants: number;
  maxParticipants: number;
}

export default function LiveSessionPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<LiveSessionConfig | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<UpcomingSession | null>(null);
  const [isInSession, setIsInSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionSettings, setSessionSettings] = useState({
    videoEnabled: true,
    audioEnabled: true,
    chatEnabled: true,
    screenShareEnabled: false
  });

  const loadConfig = useCallback(async () => {
    if (!user?.access_token) return;

    try {
      const response = await fetch('/api/client/live-session/config', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading live session config:', error);
    }
  }, [user?.access_token]);

  const loadUpcomingSessions = useCallback(async () => {
    if (!user?.access_token) return;

    try {
      const response = await fetch('/api/client/live-session/upcoming', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUpcomingSessions(data.data);
          
          // Check if there's a live session
          const liveSession = data.data.find((session: UpcomingSession) => session.status === 'live');
          if (liveSession) {
            setCurrentSession(liveSession);
            setIsInSession(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading upcoming sessions:', error);
    }
  }, [user?.access_token]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadConfig(),
        loadUpcomingSessions()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load live session data');
    } finally {
      setLoading(false);
    }
  }, [loadConfig, loadUpcomingSessions]);

  useEffect(() => {
    if (user?.access_token) {
      loadData();
    }
  }, [user?.access_token, loadData]);

  const joinSession = async (session: UpcomingSession) => {
    try {
      if (!config) {
        toast.error('Live session configuration not available');
        return;
      }

      // Create meeting if needed
      if (!session.meetingUrl) {
        const response = await fetch('/api/client/live-session/create-meeting', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: session.id,
            title: session.title,
            duration: session.duration,
            settings: sessionSettings
          })
        });

        const result = await response.json();
        if (result.success) {
          session.meetingUrl = result.data.meetingUrl;
          session.meetingId = result.data.meetingId;
        }
      }

      if (session.meetingUrl) {
        setCurrentSession(session);
        setIsInSession(true);
        toast.success('Joining live session...');
      } else {
        toast.error('Failed to create meeting');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
    }
  };

  const leaveSession = () => {
    setIsInSession(false);
    setCurrentSession(null);
    toast.success('Left the session');
  };

  const toggleVideo = () => {
    setSessionSettings(prev => ({ ...prev, videoEnabled: !prev.videoEnabled }));
  };

  const toggleAudio = () => {
    setSessionSettings(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }));
  };

  const toggleChat = () => {
    setSessionSettings(prev => ({ ...prev, chatEnabled: !prev.chatEnabled }));
  };

  const toggleScreenShare = () => {
    setSessionSettings(prev => ({ ...prev, screenShareEnabled: !prev.screenShareEnabled }));
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'live': return 'bg-green-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'live': return 'Live Now';
      case 'ended': return 'Ended';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading live sessions...</p>
        </div>
      </div>
    );
  }

  if (isInSession && currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a23] via-[#1a1a2e] to-[#16213e]">
        <div className="container mx-auto p-6">
          {/* Session Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">{currentSession.title}</h1>
              <p className="text-gray-400">{currentSession.description}</p>
            </div>
            <Button
              onClick={leaveSession}
              variant="outline"
              className="bg-red-600 text-white border-red-600 hover:bg-red-700"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Leave Session
            </Button>
          </div>

          {/* Video Conference Container */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Video Area */}
            <div className="lg:col-span-3">
              <Card className="bg-[#1a1a2e] border-[#16213e] h-[600px]">
                <CardContent className="p-0 h-full">
                  {config?.provider === 'zoom' ? (
                    <iframe
                      src={currentSession.meetingUrl}
                      className="w-full h-full rounded-lg"
                      allow="camera; microphone; fullscreen; speaker; display-capture"
                      title="Zoom Meeting"
                    />
                  ) : config?.provider === 'meet' ? (
                    <iframe
                      src={currentSession.meetingUrl}
                      className="w-full h-full rounded-lg"
                      allow="camera; microphone; fullscreen; speaker; display-capture"
                      title="Google Meet"
                    />
                  ) : config?.provider === 'teams' ? (
                    <iframe
                      src={currentSession.meetingUrl}
                      className="w-full h-full rounded-lg"
                      allow="camera; microphone; fullscreen; speaker; display-capture"
                      title="Microsoft Teams"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center">
                        <Video className="w-16 h-16 mx-auto mb-4 text-[#ffd700]" />
                        <h3 className="text-xl font-semibold mb-2">Live Session</h3>
                        <p className="text-gray-400">Video conference will start here</p>
                        <p className="text-sm text-gray-500 mt-2">Meeting ID: {currentSession.meetingId}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Controls Sidebar */}
            <div className="space-y-4">
              {/* Session Info */}
              <Card className="bg-[#1a1a2e] border-[#16213e]">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Session Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#ffd700]" />
                    <span className="text-white text-sm">
                      {currentSession.participants}/{currentSession.maxParticipants} participants
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#ffd700]" />
                    <span className="text-white text-sm">
                      {currentSession.duration} minutes
                    </span>
                  </div>
                  <Badge className={`${getStatusColor(currentSession.status)} text-white`}>
                    {getStatusText(currentSession.status)}
                  </Badge>
                </CardContent>
              </Card>

              {/* Controls */}
              <Card className="bg-[#1a1a2e] border-[#16213e]">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={toggleVideo}
                    variant={sessionSettings.videoEnabled ? "default" : "outline"}
                    className={`w-full ${sessionSettings.videoEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                  >
                    {sessionSettings.videoEnabled ? <VideoIcon className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                    {sessionSettings.videoEnabled ? 'Video On' : 'Video Off'}
                  </Button>

                  <Button
                    onClick={toggleAudio}
                    variant={sessionSettings.audioEnabled ? "default" : "outline"}
                    className={`w-full ${sessionSettings.audioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                  >
                    {sessionSettings.audioEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                    {sessionSettings.audioEnabled ? 'Audio On' : 'Audio Off'}
                  </Button>

                  <Button
                    onClick={toggleScreenShare}
                    variant={sessionSettings.screenShareEnabled ? "default" : "outline"}
                    className={`w-full ${sessionSettings.screenShareEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {sessionSettings.screenShareEnabled ? 'Stop Share' : 'Share Screen'}
                  </Button>

                  <Button
                    onClick={toggleChat}
                    variant={sessionSettings.chatEnabled ? "default" : "outline"}
                    className={`w-full ${sessionSettings.chatEnabled ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {sessionSettings.chatEnabled ? 'Chat On' : 'Chat Off'}
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-[#1a1a2e] border-[#16213e]">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23]"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23]"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Invite Others
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a23] via-[#1a1a2e] to-[#16213e]">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Live Sessions</h1>
          <p className="text-gray-400 text-lg">Join your spiritual guidance sessions</p>
        </div>

        {/* Configuration Status */}
        {config ? (
          <Card className="bg-[#1a1a2e] border-[#16213e] mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Video className="w-6 h-6 text-[#ffd700]" />
                  <div>
                    <h3 className="text-white font-semibold">Live Session Ready</h3>
                    <p className="text-gray-400 text-sm">
                      Provider: {config.name} • Status: {config.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <Badge className={config.isActive ? 'bg-green-500' : 'bg-red-500'}>
                  {config.isActive ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#1a1a2e] border-[#16213e] mb-6">
            <CardContent className="p-4">
              <div className="text-center">
                <Video className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Live Session Not Configured</h3>
                <p className="text-gray-400 text-sm">
                  Please contact your administrator to set up live session capabilities.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Sessions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Upcoming Sessions</h2>
          
          {upcomingSessions.length === 0 ? (
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardContent className="p-8 text-center">
                <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">No Sessions Scheduled</h3>
                <p className="text-gray-400">
                  You don&apos;t have any upcoming live sessions. Check back later or contact your spiritual guide.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingSessions.map((session) => (
                <Card key={session.id} className="bg-[#1a1a2e] border-[#16213e] hover:border-[#ffd700]/50 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg">{session.title}</CardTitle>
                      <Badge className={`${getStatusColor(session.status)} text-white`}>
                        {getStatusText(session.status)}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm">{session.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-[#ffd700]" />
                        <span className="text-white text-sm">
                          {formatTime(session.startTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-[#ffd700]" />
                        <span className="text-white text-sm">
                          {session.participants}/{session.maxParticipants} participants
                        </span>
                      </div>
                    </div>

                    {session.status === 'live' && (
                      <Button
                        onClick={() => joinSession(session)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Join Live Session
                      </Button>
                    )}

                    {session.status === 'scheduled' && (
                      <Button
                        onClick={() => joinSession(session)}
                        disabled={!config?.isActive}
                        className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Join Session
                      </Button>
                    )}

                    {session.status === 'ended' && (
                      <Button
                        disabled
                        className="w-full bg-gray-600 text-white cursor-not-allowed"
                      >
                        Session Ended
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
