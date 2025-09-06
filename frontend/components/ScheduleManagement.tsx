'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Plus, Edit, Trash2, Filter, CalendarDays, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import ScheduleTemplateModal from './modals/ScheduleTemplateModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';


interface SessionDuration {
  id: number;
  name: string;
  duration_minutes: number;
  description: string;
  isActive: boolean;
}

interface ScheduleTemplate {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isAvailable: boolean;
  sessionDurationId: number;
  autoAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  sessionDuration: SessionDuration;
}

interface ScheduleSlot {
  id: number;
  scheduleTemplateId: number;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  scheduleTemplate: ScheduleTemplate;
  bookings: Array<{
    id: number;
    clientId: number;
    status: string;
    bookingType: string;
    groupSize: number;
  }>;
}

const ScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplate[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [sessionDurations, setSessionDurations] = useState<SessionDuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  
  // Filters
  const [templateFilters, setTemplateFilters] = useState({
    dayOfWeek: 'all',
    isAvailable: 'all',
    sessionDurationId: 'all'
  });

  const [slotFilters, setSlotFilters] = useState({
    scheduleTemplateId: 'all',
    dateFrom: '',
    dateTo: '',
    isAvailable: 'all',
    hasCapacity: 'all'
  });

  // Modal states
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleTemplate | null>(null);
  const [deleteType, setDeleteType] = useState<'template' | 'slot'>('template');

  // Slot generation
  const [showSlotGenerationModal, setShowSlotGenerationModal] = useState(false);
  const [slotGenerationData, setSlotGenerationData] = useState({
    template_ids: [] as number[],
    start_date: '',
    end_date: '',
    overwrite_existing: false
  });

  // Calendar view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');



  const fetchScheduleTemplates = useCallback(async () => {
    try {
      console.log('🔍 fetchScheduleTemplates called');
      
      if (!user?.access_token) {
        console.log('❌ No access token for schedule templates');
        return;
      }

      const params = new URLSearchParams();

      Object.entries(templateFilters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      const response = await fetch(`/api/admin/schedule-templates?${params}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Schedule templates response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Schedule templates loaded:', data.data?.length || 0, 'items');
        setScheduleTemplates(data.data || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load schedule templates:', response.status, response.statusText);
        console.error('❌ Error response body:', errorText);
        toast.error('Failed to fetch schedule templates');
      }
    } catch (error) {
      console.error('❌ Error fetching schedule templates:', error);
      toast.error('Error fetching schedule templates');
    }
  }, [user?.access_token, templateFilters]);

  const fetchScheduleSlots = useCallback(async () => {
    try {
      console.log('🔍 fetchScheduleSlots called');
      
      if (!user?.access_token) {
        console.log('❌ No access token for schedule slots');
        return;
      }

      const params = new URLSearchParams();

      Object.entries(slotFilters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      const response = await fetch(`/api/admin/schedule-slots?${params}&enhanced=true`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Schedule slots response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Schedule slots loaded:', data.data?.length || 0, 'items');
        setScheduleSlots(data.data || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load schedule slots:', response.status, response.statusText);
        console.error('❌ Error response body:', errorText);
        toast.error('Failed to fetch schedule slots');
      }
    } catch (error) {
      console.error('❌ Error fetching schedule slots:', error);
      toast.error('Error fetching schedule slots');
    }
  }, [user?.access_token, slotFilters]);

  const fetchSessionDurations = useCallback(async () => {
    try {
      console.log('🔍 fetchSessionDurations called');
      
      if (!user?.access_token) {
        console.log('❌ No access token for session durations');
        return;
      }

      const response = await fetch('/api/admin/session-durations', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Session durations response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Session durations loaded:', data.data?.length || 0, 'items');
        setSessionDurations(data.data || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load session durations:', response.status, response.statusText);
        console.error('❌ Error response body:', errorText);
        toast.error('Failed to load session durations');
      }
    } catch (error) {
      console.error('❌ Error fetching session durations:', error);
      toast.error('Error fetching session durations');
    }
  }, [user?.access_token]);

  const fetchAllData = useCallback(async () => {
    try {
      console.log('🔍 fetchAllData called, user:', user);
      console.log('🔍 access_token exists:', !!user?.access_token);
      console.log('🔍 access_token length:', user?.access_token?.length);

      if (!user?.access_token) {
        console.log('❌ No access token, cannot load schedule data');
        toast.error('Please log in to access this feature');
        return;
      }

      setLoading(true);
      console.log('Loading schedule data...');

      await Promise.all([
        fetchSessionDurations(),
        fetchScheduleTemplates(),
        fetchScheduleSlots()
      ]);

      setLastLoaded(new Date());
      console.log('✅ Schedule data loaded successfully');
      toast.success('Schedule data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching schedule data:', error);
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  }, [user, fetchSessionDurations, fetchScheduleTemplates, fetchScheduleSlots]);

  // Add a manual refresh function that can be called from parent components
  const refreshScheduleData = useCallback(() => {
    if (user?.access_token) {
      console.log('Manual refresh requested...');
      fetchAllData();
    }
  }, [user?.access_token, fetchAllData]);

  useEffect(() => {
    if (user?.access_token) {
      console.log('User authenticated, loading schedule data...');
      fetchAllData();
    } else {
      console.log('User not authenticated, clearing schedule data...');
      setScheduleTemplates([]);
      setScheduleSlots([]);
      setSessionDurations([]);
      setLoading(false);
    }
  }, [user?.access_token, fetchAllData]);

  // Refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.access_token && scheduleTemplates.length === 0) {
        console.log('Component became visible, refreshing schedule data...');
        fetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.access_token, scheduleTemplates.length, fetchAllData]);

  // Additional effect to handle component mounting/navigation
  useEffect(() => {
    if (user?.access_token && scheduleTemplates.length === 0) {
      console.log('Component mounted or navigated to, loading schedule data...');
      fetchAllData();
    }
  }, [user?.access_token, scheduleTemplates.length, fetchAllData]);

  // Expose refresh function to parent components if needed
  useEffect(() => {
    // @ts-expect-error - Exposing refresh function globally for debugging
    window.refreshScheduleData = refreshScheduleData;

    return () => {
      // @ts-expect-error - Clean up global function
      delete window.refreshScheduleData;
    };
  }, [refreshScheduleData]);

  // Listen for navigation events and refresh data when needed
  useEffect(() => {
    const handleNavigation = () => {
      // Small delay to ensure the component is fully mounted
      setTimeout(() => {
        if (user?.access_token && scheduleTemplates.length === 0) {
          console.log('Navigation detected, refreshing schedule data...');
          fetchAllData();
        }
      }, 100);
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [user?.access_token, scheduleTemplates.length, fetchAllData]);

  const handleCreateTemplate = async (data: unknown) => {
    if (!user?.access_token) return;
    try {
      const response = await fetch('/api/admin/schedule-templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (responseData.success) {
        toast.success('Schedule template created successfully');
        setShowCreateTemplateModal(false);
        fetchScheduleTemplates();
      } else {
        toast.error(responseData.message || 'Failed to create schedule template');
      }
    } catch {
      toast.error('Error creating schedule template');
    }
  };

  const handleEditTemplate = async (data: unknown) => {
    if (!user?.access_token || !selectedItem) return;
    
    try {
      const response = await fetch('/api/admin/schedule-templates', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedItem.id,
          ...(data as Record<string, unknown>)
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        toast.success('Schedule template updated successfully');
        setShowEditTemplateModal(false);
        setSelectedItem(null);
        fetchScheduleTemplates();
      } else {
        toast.error(responseData.message || 'Failed to update schedule template');
      }
    } catch {
      toast.error('Error updating schedule template');
    }
  };

  const handleDelete = async () => {
    if (!user?.access_token || !selectedItem) return;
    
    try {
      const endpoint = deleteType === 'template' ? 'schedule-templates' : 'schedule-slots';
      const response = await fetch(`/api/admin/${endpoint}?id=${selectedItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${deleteType === 'template' ? 'Schedule template' : 'Schedule slot'} deleted successfully`);
        setShowDeleteModal(false);
        setSelectedItem(null);
        if (deleteType === 'template') {
          fetchScheduleTemplates();
        } else {
          fetchScheduleSlots();
        }
      } else {
        toast.error(data.message || `Failed to delete ${deleteType}`);
      }
    } catch {
      toast.error(`Error deleting ${deleteType}`);
    }
  };

  const handleGenerateSlots = async () => {
    if (!user?.access_token || slotGenerationData.template_ids.length === 0) return;
    
    try {
      const response = await fetch('/api/admin/schedule-slots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'generate_slots',
          ...slotGenerationData
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully generated ${data.data.slots_generated} schedule slots`);
        setShowSlotGenerationModal(false);
        setSlotGenerationData({
          template_ids: [],
          start_date: '',
          end_date: '',
          overwrite_existing: false
        });
        fetchScheduleSlots();
      } else {
        toast.error(data.message || 'Failed to generate schedule slots');
      }
    } catch {
      toast.error('Error generating schedule slots');
    }
  };

  const getDayOfWeekBadge = (day: string) => {
    const variants = {
      monday: 'dashboard-badge-info',
      tuesday: 'dashboard-badge-success',
      wednesday: 'dashboard-badge-warning',
      thursday: 'dashboard-badge-error',
      friday: 'dashboard-badge-gold',
      saturday: 'dashboard-badge-info',
      sunday: 'dashboard-badge-success'
    };
    return <Badge className={variants[day.toLowerCase() as keyof typeof variants]}>{day}</Badge>;
  };

  const getAvailabilityBadge = (isAvailable: boolean, bookedCount: number, capacity: number) => {
    if (!isAvailable) {
      return <Badge className="dashboard-badge-error">Unavailable</Badge>;
    }
    
    if (bookedCount >= capacity) {
      return <Badge className="dashboard-badge-error">Full</Badge>;
    }
    
    if (bookedCount > 0) {
      return <Badge className="dashboard-badge-warning">{bookedCount}/{capacity}</Badge>;
    }
    
    return <Badge className="dashboard-badge-success">Available</Badge>;
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading schedule management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dashboard-text-primary text-3xl font-bold">Schedule Management</h1>
          <p className="dashboard-text-secondary">Manage recurring availability patterns and generate bookable time slots</p>
          {lastLoaded && (
            <p className="text-sm text-gray-400 mt-1">
              Last updated: {lastLoaded.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <BaseButton 
            variant="outline" 
            className="dashboard-button-outline"
            onClick={refreshScheduleData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </BaseButton>
          <BaseButton 
            className="dashboard-button-primary"
            onClick={() => setShowCreateTemplateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </BaseButton>
          <BaseButton 
            variant="outline" 
            className="dashboard-button-outline"
            onClick={() => setShowSlotGenerationModal(true)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Generate Slots
          </BaseButton>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="dashboard-tabs">
          <TabsTrigger value="templates" className="dashboard-tab">
            <Clock className="w-4 h-4 mr-2" />
            Schedule Templates
          </TabsTrigger>
          <TabsTrigger value="calendar" className="dashboard-tab">
            <CalendarDays className="w-4 h-4 mr-2" />
            Availability Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Schedule Templates Tab Content */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="dashboard-card-title">Schedule Templates</CardTitle>
              <CardDescription className="dashboard-card-description">
                Recurring availability patterns for different days and times
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label className="dashboard-label">Day of Week</Label>
                  <Select 
                    value={templateFilters.dayOfWeek} 
                    onValueChange={(value) => setTemplateFilters(prev => ({ ...prev, dayOfWeek: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All Days</SelectItem>
                      <SelectItem value="monday" className="dashboard-dropdown-item">Monday</SelectItem>
                      <SelectItem value="tuesday" className="dashboard-dropdown-item">Tuesday</SelectItem>
                      <SelectItem value="wednesday" className="dashboard-dropdown-item">Wednesday</SelectItem>
                      <SelectItem value="thursday" className="dashboard-dropdown-item">Thursday</SelectItem>
                      <SelectItem value="friday" className="dashboard-dropdown-item">Friday</SelectItem>
                      <SelectItem value="saturday" className="dashboard-dropdown-item">Saturday</SelectItem>
                      <SelectItem value="sunday" className="dashboard-dropdown-item">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="dashboard-label">Session Duration</Label>
                  <Select 
                    value={templateFilters.sessionDurationId} 
                    onValueChange={(value) => setTemplateFilters(prev => ({ ...prev, sessionDurationId: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All Durations</SelectItem>
                      {sessionDurations.map((duration) => (
                        <SelectItem key={duration.id} value={duration.id.toString()} className="dashboard-dropdown-item">
                          {duration.name} ({duration.duration_minutes} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="dashboard-label">Status</Label>
                  <Select 
                    value={templateFilters.isAvailable} 
                    onValueChange={(value) => setTemplateFilters(prev => ({ ...prev, isAvailable: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All Status</SelectItem>
                      <SelectItem value="true" className="dashboard-dropdown-item">Available</SelectItem>
                      <SelectItem value="false" className="dashboard-dropdown-item">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <BaseButton 
                  variant="outline" 
                  className="dashboard-button-outline"
                  onClick={fetchScheduleTemplates}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </BaseButton>
              </div>

              {/* Schedule Templates Table */}
              <div className="overflow-x-auto">
                <table className="dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Day</th>
                      <th>Time Range</th>
                      <th>Capacity</th>
                      <th>Session Duration</th>
                      <th>Status</th>
                      <th>Auto Available</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleTemplates.map((template) => (
                      <tr key={template.id} className="dashboard-table-row">
                        <td>{getDayOfWeekBadge(template.dayOfWeek)}</td>
                        <td className="font-mono">
                          {formatTime(template.startTime)} - {formatTime(template.endTime)}
                        </td>
                        <td>
                          <Badge className="dashboard-badge">
                            <Users className="w-4 h-4 mr-1" />
                            {template.capacity}
                          </Badge>
                        </td>
                        <td>
                          {template.sessionDuration ? (
                            <Badge className="dashboard-badge-info">
                              {template.sessionDuration.name}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">Any</span>
                          )}
                        </td>
                        <td>
                          <Badge className={template.isAvailable ? 'dashboard-badge-success' : 'dashboard-badge-error'}>
                            {template.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </td>
                        <td>
                          <Badge className={template.autoAvailable ? 'dashboard-badge-success' : 'dashboard-badge-warning'}>
                            {template.autoAvailable ? 'Auto' : 'Manual'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <BaseButton
                              size="sm"
                              variant="outline"
                              className="dashboard-button-outline"
                              onClick={() => {
                                setSelectedItem(template);
                                setShowEditTemplateModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </BaseButton>
                            <BaseButton
                              size="sm"
                              variant="outline"
                              className="dashboard-button-danger"
                              onClick={() => {
                                setSelectedItem(template);
                                setDeleteType('template');
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </BaseButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          {/* Availability Calendar Tab Content */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="dashboard-card-title">Availability Calendar</CardTitle>
              <CardDescription className="dashboard-card-description">
                Generated time slots based on your schedule templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Calendar Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <BaseButton
                    variant="outline"
                    className="dashboard-button-outline"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      if (calendarView === 'week') {
                        newDate.setDate(newDate.getDate() - 7);
                      } else {
                        newDate.setMonth(newDate.getMonth() - 1);
                      }
                      setCurrentDate(newDate);
                    }}
                  >
                    Previous
                  </BaseButton>
                  
                  <div className="flex items-center gap-2">
                    <BaseButton
                                              variant={calendarView === 'week' ? 'primary' : 'outline'}
                      className={calendarView === 'week' ? 'dashboard-button-primary' : 'dashboard-button-outline'}
                      onClick={() => setCalendarView('week')}
                    >
                      Week
                    </BaseButton>
                    <BaseButton
                                              variant={calendarView === 'month' ? 'primary' : 'outline'}
                      className={calendarView === 'month' ? 'dashboard-button-primary' : 'dashboard-button-outline'}
                      onClick={() => setCalendarView('month')}
                    >
                      Month
                    </BaseButton>
                  </div>
                  
                  <BaseButton
                    variant="outline"
                    className="dashboard-button-outline"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      if (calendarView === 'week') {
                        newDate.setDate(newDate.getDate() + 7);
                      } else {
                        newDate.setMonth(newDate.getMonth() + 1);
                      }
                      setCurrentDate(newDate);
                    }}
                  >
                    Next
                  </BaseButton>
                </div>
                
                <div className="text-lg font-semibold text-dashboard-text-primary">
                  {currentDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label className="dashboard-label">Template</Label>
                  <Select 
                    value={slotFilters.scheduleTemplateId} 
                    onValueChange={(value) => setSlotFilters(prev => ({ ...prev, scheduleTemplateId: value }))}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All Templates</SelectItem>
                      {scheduleTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()} className="dashboard-dropdown-item">
                          {template.dayOfWeek} {formatTime(template.startTime)}-{formatTime(template.endTime)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="dashboard-label">Start Date</Label>
                  <BaseInput
                    type="date"
                    className="dashboard-input"
                    value={slotFilters.dateFrom}
                    onChange={(e) => setSlotFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <Label className="dashboard-label">End Date</Label>
                  <BaseInput
                    type="date"
                    className="dashboard-input"
                    value={slotFilters.dateTo}
                    onChange={(e) => setSlotFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
                <BaseButton 
                  variant="outline" 
                  className="dashboard-button-outline"
                  onClick={fetchScheduleSlots}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </BaseButton>
              </div>

              {/* Schedule Slots Table */}
              <div className="overflow-x-auto">
                <table className="dashboard-table">
                  <thead className="dashboard-table-header">
                    <tr>
                      <th>Date & Time</th>
                      <th>Template</th>
                      <th>Capacity</th>
                      <th>Bookings</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleSlots.map((slot) => (
                      <tr key={slot.id} className="dashboard-table-row">
                        <td className="font-medium">
                          <div className="space-y-1">
                            <div>{formatDateTime(slot.startTime)}</div>
                            <div className="text-sm text-gray-500">
                              {formatTime(slot.scheduleTemplate.startTime)} - {formatTime(slot.scheduleTemplate.endTime)}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge className="dashboard-badge">
                            {slot.scheduleTemplate.dayOfWeek}
                          </Badge>
                        </td>
                        <td>
                          <Badge className="dashboard-badge">
                            <Users className="w-4 h-4 mr-1" />
                            {slot.capacity}
                          </Badge>
                        </td>
                        <td>
                          <Badge className="dashboard-badge-info">
                            {slot.bookings?.length || 0} bookings
                          </Badge>
                        </td>
                        <td>
                          {getAvailabilityBadge(slot.isAvailable, slot.bookedCount, slot.capacity)}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <BaseButton
                              size="sm"
                              variant="outline"
                              className="dashboard-button-outline"
                              onClick={() => {
                                // TODO: Implement slot editing
                                toast.info('Slot editing coming soon');
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </BaseButton>
                            <BaseButton
                              size="sm"
                              variant="outline"
                              className="dashboard-button-danger"
                              onClick={() => {
                                setSelectedItem(slot as any);
                                setDeleteType('slot');
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </BaseButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ScheduleTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        onSubmit={handleCreateTemplate}
        sessionDurations={sessionDurations}
        mode="create"
      />

      <ScheduleTemplateModal
        isOpen={showEditTemplateModal}
        onClose={() => setShowEditTemplateModal(false)}
        onSubmit={handleEditTemplate}
        scheduleTemplate={selectedItem}
        sessionDurations={sessionDurations}
        mode="edit"
      />

      {/* Slot Generation Modal */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${showSlotGenerationModal ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="dashboard-modal max-w-md">
            <div className="dashboard-modal-header">
              <h3 className="dashboard-modal-title">Generate Schedule Slots</h3>
              <p className="dashboard-modal-description">
                Generate bookable time slots based on your schedule templates
              </p>
            </div>
            
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <Label className="dashboard-label">Select Templates</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {scheduleTemplates.filter(t => t.isAvailable).map((template) => (
                    <label key={template.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={slotGenerationData.template_ids.includes(template.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSlotGenerationData(prev => ({
                              ...prev,
                              template_ids: [...prev.template_ids, template.id]
                            }));
                          } else {
                            setSlotGenerationData(prev => ({
                              ...prev,
                              template_ids: prev.template_ids.filter(id => id !== template.id)
                            }));
                          }
                        }}
                        className="dashboard-checkbox"
                      />
                      <span className="text-sm">
                        {template.dayOfWeek} {formatTime(template.startTime)}-{formatTime(template.endTime)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="dashboard-label">Start Date</Label>
                  <BaseInput
                    type="date"
                    className="dashboard-input"
                    value={slotGenerationData.start_date}
                    onChange={(e) => setSlotGenerationData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dashboard-label">End Date</Label>
                  <BaseInput
                    type="date"
                    className="dashboard-input"
                    value={slotGenerationData.end_date}
                    onChange={(e) => setSlotGenerationData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="overwrite_existing"
                  checked={slotGenerationData.overwrite_existing}
                  onChange={(e) => setSlotGenerationData(prev => ({ ...prev, overwrite_existing: e.target.checked }))}
                  className="dashboard-checkbox"
                />
                <Label htmlFor="overwrite_existing" className="dashboard-label">
                  Overwrite existing slots
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 pt-0">
              <BaseButton
                variant="outline"
                className="dashboard-button-outline"
                onClick={() => setShowSlotGenerationModal(false)}
              >
                Cancel
              </BaseButton>
              <BaseButton
                className="dashboard-button-primary"
                onClick={handleGenerateSlots}
                disabled={slotGenerationData.template_ids.length === 0 || !slotGenerationData.start_date || !slotGenerationData.end_date}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Slots
              </BaseButton>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${deleteType === 'template' ? 'Schedule Template' : 'Schedule Slot'}`}
        description={`Are you sure you want to delete this ${deleteType === 'template' ? 'schedule template' : 'schedule slot'}?`}
        itemName={selectedItem ? ('dayOfWeek' in selectedItem ? selectedItem.dayOfWeek : 'slot') : undefined}
        itemType={deleteType}
      />
    </div>
  );
};

export default ScheduleManagement;