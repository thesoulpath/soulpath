'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseInput } from '@/components/ui/BaseInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, DollarSign, UserCheck, Clock3, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';


interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: string;
}

interface ScheduleSlot {
  id: number;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  is_available: boolean;
  schedule_templates: {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    session_durations: {
      id: number;
      name: string;
      duration_minutes: number;
    };
  };
}

interface UserPackage {
  id: number;
  sessions_remaining: number;
  sessions_used: number;
  is_active: boolean;
  package_definition: {
    id: number;
    name: string;
    description: string;
    sessions_count: number;
    package_type: 'individual' | 'group' | 'mixed';
    max_group_size: number;
    session_durations: {
      id: number;
      name: string;
      duration_minutes: number;
    };
  };
  package_price: {
    id: number;
    price: number;
    pricing_mode: 'custom' | 'calculated';
    currencies: {
      id: number;
      code: string;
      name: string;
      symbol: string;
    };
  };
}

interface Booking {
  id: number;
  client_id: number;
  clientEmail: string;
  schedule_slot_id: number;
  user_package_id: number;
  booking_type: 'individual' | 'group';
  group_size?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  total_amount?: number;
  discount_amount: number;
  final_amount?: number;
  cancelled_at?: string;
  cancelled_reason?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  schedule_slot?: ScheduleSlot;
  user_package?: UserPackage;
}

interface BookingFilters {
  client_id: string;
  status: string;
  date_from: string;
  date_to: string;
  booking_type: string;
  package_type: string;
}

const BookingsManagement: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  // Filters
  const [filters, setFilters] = useState<BookingFilters>({
    client_id: 'all',
    status: 'all',
    date_from: '',
    date_to: '',
    booking_type: 'all',
    package_type: 'all'
  });

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Booking | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    groupBookings: 0,
    individualBookings: 0
  });



  const fetchBookings = useCallback(async () => {
    if (!user?.access_token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value && value !== '' && value !== 'all')
        )
      });

      const response = await fetch(`/api/admin/bookings?${params}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setBookings(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      } else {
        toast.error('Failed to fetch bookings');
      }
    } catch {
      toast.error('Error fetching bookings');
    } finally {
      setLoading(false);
    }
  }, [user?.access_token, pagination.page, pagination.limit, filters]);

  const fetchClients = useCallback(async () => {
    if (!user?.access_token) return;
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setClients(data.data);
      } else {
        toast.error('Failed to fetch clients');
      }
    } catch {
      toast.error('Error fetching clients');
    }
  }, [user?.access_token]);

  const fetchStats = useCallback(async () => {
    if (!user?.access_token) return;
    try {
      const response = await fetch('/api/admin/bookings/stats', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user?.access_token]);

  useEffect(() => {
    if (user?.access_token) {
      fetchBookings();
      fetchClients();
      fetchStats();
    }
  }, [user?.access_token, pagination.page, filters, fetchBookings, fetchClients, fetchStats]);

  const handleStatusUpdate = async (bookingId: number, newStatus: string) => {
    if (!user?.access_token) return;
    
    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: bookingId,
          status: newStatus
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Booking status updated successfully');
        fetchBookings();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to update booking status');
      }
    } catch {
      toast.error('Error updating booking status');
    }
  };

  const handleDelete = async () => {
    if (!user?.access_token || !selectedItem) return;
    
    try {
      const response = await fetch(`/api/admin/bookings?id=${selectedItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Booking deleted successfully');
        setShowDeleteModal(false);
        setSelectedItem(null);
        fetchBookings();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to delete booking');
      }
    } catch {
      toast.error('Error deleting booking');
    }
  };



  const getBookingTypeBadge = (type: string) => {
    const variants = {
      individual: 'dashboard-badge-info',
      group: 'dashboard-badge-success'
    };
    return <Badge className={variants[type as keyof typeof variants]}>{type}</Badge>;
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

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading bookings management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dashboard-text-primary text-3xl font-bold">Bookings Management</h1>
          <p className="dashboard-text-secondary">Manage all client bookings and appointments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dashboard-text-secondary">Total Bookings</p>
                <p className="text-2xl font-bold text-dashboard-text-primary">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-dashboard-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dashboard-text-secondary">Active Bookings</p>
                <p className="text-2xl font-bold text-dashboard-text-primary">{stats.activeBookings}</p>
              </div>
              <UserCheck className="w-8 h-8 text-dashboard-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dashboard-text-secondary">Today&apos;s Bookings</p>
                <p className="text-2xl font-bold text-dashboard-text-primary">{stats.todayBookings}</p>
              </div>
              <Clock3 className="w-8 h-8 text-dashboard-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dashboard-text-secondary">Total Revenue</p>
                <p className="text-2xl font-bold text-dashboard-text-primary">${stats.totalRevenue}</p>
              </div>
              <DollarSign className="w-8 h-8 text-dashboard-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="dashboard-card-title">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="dashboard-label">Client</Label>
              <Select
                value={filters.client_id}
                onValueChange={(value) => setFilters(prev => ({ ...prev, client_id: value }))}
              >
                <SelectTrigger className="dashboard-input">
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()} className="dashboard-dropdown-item">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="dashboard-input">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All statuses</SelectItem>
                  <SelectItem value="pending" className="dashboard-dropdown-item">Pending</SelectItem>
                  <SelectItem value="confirmed" className="dashboard-dropdown-item">Confirmed</SelectItem>
                  <SelectItem value="completed" className="dashboard-dropdown-item">Completed</SelectItem>
                  <SelectItem value="cancelled" className="dashboard-dropdown-item">Cancelled</SelectItem>
                  <SelectItem value="no-show" className="dashboard-dropdown-item">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Booking Type</Label>
              <Select
                value={filters.booking_type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, booking_type: value }))}
              >
                <SelectTrigger className="dashboard-input">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All types</SelectItem>
                  <SelectItem value="individual" className="dashboard-dropdown-item">Individual</SelectItem>
                  <SelectItem value="group" className="dashboard-dropdown-item">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Date From</Label>
              <BaseInput
                type="date"
                className="dashboard-input"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Date To</Label>
              <BaseInput
                type="date"
                className="dashboard-input"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="dashboard-label">Package Type</Label>
              <Select
                value={filters.package_type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, package_type: value }))}
              >
                <SelectTrigger className="dashboard-input">
                  <SelectValue placeholder="All package types" />
                </SelectTrigger>
                <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="all" className="dashboard-dropdown-item">All package types</SelectItem>
                  <SelectItem value="individual" className="dashboard-dropdown-item">Individual</SelectItem>
                  <SelectItem value="group" className="dashboard-dropdown-item">Group</SelectItem>
                  <SelectItem value="mixed" className="dashboard-dropdown-item">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="dashboard-card-title">Bookings</CardTitle>
          <CardDescription>
            Showing {bookings.length} of {pagination.total} bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bookings found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or create a new booking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Client</th>
                    <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Date & Time</th>
                    <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Package</th>
                    <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-dashboard-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-dashboard-text-primary">
                            {booking.client?.name || 'Client'}
                          </p>
                          <p className="text-sm text-dashboard-text-secondary">
                            {booking.client?.email || booking.clientEmail || 'No email'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-dashboard-text-primary">
                            {booking.schedule_slot ? formatDate(booking.schedule_slot.start_time) : 'No slot'}
                          </p>
                          <p className="text-sm text-dashboard-text-secondary">
                            {booking.schedule_slot ? formatDateTime(booking.schedule_slot.start_time) : 'No time'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-dashboard-text-primary">
                            {booking.user_package?.package_definition?.name || 'No package'}
                          </p>
                          <p className="text-sm text-dashboard-text-secondary">
                            {booking.user_package?.package_definition?.session_durations?.duration_minutes || '0'} min
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getBookingTypeBadge(booking.booking_type)}
                        {booking.booking_type === 'group' && booking.group_size && (
                          <p className="text-sm text-dashboard-text-secondary mt-1">
                            Size: {booking.group_size}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={booking.status}
                          onValueChange={(value) => handleStatusUpdate(booking.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                                          <SelectContent className="dashboard-dropdown-content">
                  <SelectItem value="pending" className="dashboard-dropdown-item">Pending</SelectItem>
                  <SelectItem value="confirmed" className="dashboard-dropdown-item">Confirmed</SelectItem>
                  <SelectItem value="completed" className="dashboard-dropdown-item">Completed</SelectItem>
                  <SelectItem value="cancelled" className="dashboard-dropdown-item">Cancelled</SelectItem>
                  <SelectItem value="no-show" className="dashboard-dropdown-item">No Show</SelectItem>
                </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        {booking.final_amount ? (
                          <div>
                            <p className="font-medium text-dashboard-text-primary">
                              ${booking.final_amount}
                            </p>
                            {booking.discount_amount > 0 && (
                              <p className="text-sm text-dashboard-text-secondary">
                                -${booking.discount_amount} discount
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-dashboard-text-secondary">Not set</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <BaseButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(booking);
                              setShowDeleteModal(true);
                            }}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 size={14} />
                          </BaseButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-dashboard-text-secondary">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <BaseButton
              variant="outline"
              className="dashboard-button-outline"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
            >
              Previous
            </BaseButton>
            <BaseButton
              variant="outline"
              className="dashboard-button-outline"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </BaseButton>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDelete}
        title="Delete Booking"
        description="Are you sure you want to delete this booking? This action cannot be undone."
                        itemName={selectedItem ? `${selectedItem.client?.name || selectedItem.clientEmail || 'Unknown Client'} - ${selectedItem.schedule_slot ? formatDate(selectedItem.schedule_slot.start_time) : 'unknown date'}` : undefined}
        itemType="booking"
      />
    </div>
  );
};

export default BookingsManagement;
