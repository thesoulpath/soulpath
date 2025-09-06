import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Edit, Clock, User, Search, Calendar, Grid, List, 
  RefreshCw, Eye, CheckCircle, History, Download, Star, ArrowUpDown, Trash2
} from 'lucide-react';
import { BaseButton } from './ui/BaseButton';
import { BaseInput } from './ui/BaseInput';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

import { useAuth } from '../hooks/useAuth';
import CreateBookingModal from './modals/CreateBookingModal';


interface Client {
  id: string;
  fullName: string; // Changed from 'name' to 'fullName'
  email: string;
  phone?: string;
  status: string;
  birthDate: string;
  birthTime?: string;
  birthPlace: string;
  question: string;
  language: string;
  adminNotes?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  sessionType?: string;
  lastReminderSent?: string;
  lastBooking?: string;
  createdAt: string;
  updatedAt?: string;
  totalBookings?: number;
  isRecurrent?: boolean;
  role?: string; // Added role field
}

interface Booking {
  id: string;
  clientId: string;
  date: string;
  time: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  sessionType?: string;
  price?: number;
  rating?: number;
  feedback?: string;
}

interface ClientModalProps {
  client: Client | null;
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
}

function ClientModal({ client, isOpen, mode, onClose, onSave }: ClientModalProps) {
  const [formData, setFormData] = useState<Partial<Client>>({
    fullName: '',
    email: '',
    phone: '',
    status: 'active',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    question: '',
    language: 'en',
    adminNotes: ''
  });

  useEffect(() => {
    if (client && mode !== 'create') {
      setFormData(client);
    } else {
            setFormData({
        fullName: '',
        email: '',
        phone: '',
        status: 'active',
        birthDate: '',
        birthTime: '',
        birthPlace: '',
        question: '',
        language: 'en',
        adminNotes: ''
      });
    }
  }, [client, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1a1a2e] border border-[#16213e] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-heading text-white">
                {mode === 'create' ? 'Add New Client' : mode === 'edit' ? 'Edit Client' : 'Client Details'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {mode === 'create' ? 'Enter client information' : mode === 'edit' ? 'Update client details' : 'View client information'}
              </p>
            </div>
            <BaseButton
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
            >
              ✕
            </BaseButton>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-[#2a2a4a] pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-400">Full Name *</Label>
                  <BaseInput
                    id="name"
                    value={formData.fullName || ''}
                                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="bg-[#1a1a2e] border-[#16213e] text-white"
                    disabled={mode === 'view'}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-400">Email *</Label>
                  <BaseInput
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-[#1a1a2e] border-[#16213e] text-white"
                    disabled={mode === 'view'}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-400">Phone</Label>
                  <BaseInput
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-[#1a1a2e] border-[#16213e] text-white"
                    disabled={mode === 'view'}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="language" className="text-gray-400">Language</Label>
                  <Select
                    value={formData.language || 'en'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                    disabled={mode === 'view'}
                  >
                    <SelectTrigger className="bg-[#1a1a2e] border-[#16213e] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="en" className="dashboard-dropdown-item">🇺🇸 English</SelectItem>
                      <SelectItem value="es" className="dashboard-dropdown-item">🇪🇸 Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status" className="text-gray-400">Status</Label>
                                  <Select
                  value={formData.status || 'active'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={mode === 'view'}
                >
                    <SelectTrigger className="bg-[#1a1a2e] border-[#16213e] text-white">
                      <SelectValue />
                    </SelectTrigger>
                                                          <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="active" className="dashboard-dropdown-item">Active</SelectItem>
                      <SelectItem value="pending" className="dashboard-dropdown-item">Pending</SelectItem>
                      <SelectItem value="confirmed" className="dashboard-dropdown-item">Confirmed</SelectItem>
                      <SelectItem value="completed" className="dashboard-dropdown-item">Completed</SelectItem>
                      <SelectItem value="cancelled" className="dashboard-dropdown-item">Cancelled</SelectItem>
                      <SelectItem value="no-show" className="dashboard-dropdown-item">No Show</SelectItem>
                      <SelectItem value="inactive" className="dashboard-dropdown-item">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Astrology Chart Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-[#2a2a4a] pb-2">
                Astrology Chart Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthDate" className="text-gray-400">Birth Date *</Label>
                  <BaseInput
                    id="birthDate"
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="bg-[#1a1a2e] border-[#16213e] text-white"
                    disabled={mode === 'view'}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="birthTime" className="text-gray-400">Birth Time (Optional)</Label>
                  <BaseInput
                    id="birthTime"
                    type="time"
                    value={formData.birthTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthTime: e.target.value }))}
                    className="bg-[#1a1a2e] border-[#16213e] text-white"
                    disabled={mode === 'view'}
                    placeholder="Leave empty if unknown"
                  />
                  <p className="text-xs text-gray-400/70 mt-1">Leave empty if birth time is unknown</p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="birthPlace" className="text-gray-400">Birth Place *</Label>
                  <BaseInput
                    id="birthPlace"
                    value={formData.birthPlace || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthPlace: e.target.value }))}
                    className="bg-[#1a1a2e] border-[#16213e] text-white"
                    disabled={mode === 'view'}
                    placeholder="City, Country (or just City if country unknown)"
                    required
                  />
                  <p className="text-xs text-gray-400/70 mt-1">City and country preferred, but city alone is acceptable</p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="question" className="text-gray-400">Question/Focus Areas *</Label>
                  <Textarea
                    id="question"
                    value={formData.question || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    className="bg-[#1a1a2e] border-[#16213e] text-white min-h-[100px]"
                    disabled={mode === 'view'}
                    placeholder="What would you like to explore in your reading?"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Admin & CRM Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-[#2a2a4a] pb-2">
                Admin & CRM
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="adminNotes" className="text-gray-400">Admin Notes (CRM History)</Label>
                  <Textarea
                    id="adminNotes"
                    value={formData.adminNotes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    className="bg-[#1a1a2e] border-[#16213e] text-white min-h-[100px]"
                    disabled={mode === 'view'}
                    placeholder="Internal notes, follow-up actions, client preferences, etc."
                  />
                </div>
              </div>
            </div>

            {mode !== 'view' && (
              <div className="flex justify-end space-x-3">
                <BaseButton
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
                >
                  Cancel
                </BaseButton>
                <BaseButton
                  type="submit"
                  className="dashboard-button-primary"
                >
                  {mode === 'create' ? 'Add Client' : 'Save Changes'}
                </BaseButton>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

interface BookingHistoryModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

function BookingHistoryModal({ client, isOpen, onClose }: BookingHistoryModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const loadBookingHistory = useCallback(async () => {
    if (!client || !user?.access_token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/${client.id}/bookings`,
        {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading booking history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [client, user?.access_token]);

  useEffect(() => {
    if (isOpen && client) {
      loadBookingHistory();
    }
  }, [isOpen, client, loadBookingHistory]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
      'confirmed': { color: 'bg-blue-500/20 text-blue-400', label: 'Confirmed' },
      'completed': { color: 'bg-green-500/20 text-green-400', label: 'Completed' },
      'cancelled': { color: 'bg-red-500/20 text-red-400', label: 'Cancelled' },
      'no-show': { color: 'bg-gray-500/20 text-gray-400', label: 'No Show' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1a1a2e] border border-[#16213e] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-heading text-white">Booking History</h2>
              <p className="text-sm text-gray-400 mt-1">
                All bookings for {client?.fullName} ({client?.email})
              </p>
            </div>
            <BaseButton
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
            >
              ✕
            </BaseButton>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full"
              />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400/50 mb-4" />
              <p className="text-gray-400 text-lg mb-2">No booking history</p>
              <p className="text-gray-400/60 text-sm">This client hasn&apos;t made any bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">
                  Total bookings: {bookings.length}
                </p>
                <BaseButton
                  variant="outline"
                  size="sm"
                  className="border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700]/10"
                >
                  <Download size={16} className="mr-2" />
                  Export
                </BaseButton>
              </div>

              <div className="space-y-3">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="bg-[#1a1a2e] border-[#16213e]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-[#FFD700]/20 rounded-lg flex items-center justify-center">
                            <Calendar size={20} className="text-[#FFD700]" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                                                          <p className="font-medium text-white">
                              {formatDate(booking.date)}
                            </p>
                            <span className="text-gray-400">•</span>
                            <p className="text-gray-400">{booking.time}</p>
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>Type: {booking.sessionType || 'Standard Reading'}</span>
                              {booking.price && <span>• ${booking.price}</span>}
                              {booking.rating && (
                                <div className="flex items-center space-x-1">
                                  <span>•</span>
                                  <Star size={14} className="text-yellow-400" />
                                  <span>{booking.rating}/5</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            Booked: {formatDate(booking.createdAt)}
                          </p>
                          {booking.completedAt && (
                            <p className="text-xs text-green-400">
                              Completed: {formatDate(booking.completedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t border-[#C0C0C0]/10">
                          <p className="text-sm text-[#EAEAEA]/80">{booking.notes}</p>
                        </div>
                      )}
                      {booking.feedback && (
                        <div className="mt-3 pt-3 border-t border-[#C0C0C0]/10">
                          <p className="text-xs text-[#C0C0C0] mb-1">Client Feedback:</p>
                          <p className="text-sm text-[#EAEAEA]/80 italic">&quot;{booking.feedback}&quot;</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function ClientManagement() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);

  console.log('ClientManagement component rendered, user:', user?.email, 'clients count:', clients.length);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status' | 'bookings'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view' | 'history';
  }>({ isOpen: false, mode: 'view' });
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [selectedClientForBooking, setSelectedClientForBooking] = useState<Client | null>(null);

  const loadClients = useCallback(async () => {
    try {
      console.log('🔍 loadClients called, user:', user);
      console.log('🔍 access_token exists:', !!user?.access_token);
      console.log('🔍 access_token length:', user?.access_token?.length);

      if (!user?.access_token) {
        console.log('❌ No access token, cannot load clients');
        toast.error('Please log in to access this feature');
        return;
      }

      setIsLoading(true);
      console.log('Loading clients...');

      const response = await fetch(
        `/api/admin/users?enhanced=true`,
        {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('🔍 API response status:', response.status);
      console.log('🔍 API response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        const loadedClients = data.data || [];
        console.log('Loaded clients:', loadedClients);
        console.log('Client statuses:', loadedClients.map((c: { name: string; status: string }) => ({ name: c.name, status: c.status })));
        setClients(loadedClients);
        setLastLoaded(new Date());

        if (loadedClients.length > 0) {
          toast.success(`Loaded ${loadedClients.length} clients successfully`);
        } else {
          toast.info('No clients found');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load clients:', response.status, response.statusText);
        console.error('❌ Error response body:', errorText);
        toast.error('Failed to load clients');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Error loading clients');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Add a manual refresh function that can be called from parent components
  const refreshClients = useCallback(() => {
    if (user?.access_token) {
      console.log('Manual refresh requested...');
      loadClients();
    }
  }, [user?.access_token, loadClients]);

  useEffect(() => {
    if (user?.access_token) {
      console.log('User authenticated, loading clients...');
      loadClients();
    } else {
      console.log('User not authenticated, clearing clients...');
      setClients([]);
      setIsLoading(false);
    }
  }, [user?.access_token, loadClients]);

  // Refresh clients when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.access_token && clients.length === 0) {
        console.log('Component became visible, refreshing clients...');
        loadClients();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.access_token, clients.length, loadClients]);

  // Refresh clients when component mounts or when user navigates to it
  useEffect(() => {
    if (user?.access_token && clients.length === 0) {
      console.log('Component mounted or navigated to, loading clients...');
      loadClients();
    }
  }, [user?.access_token, clients.length, loadClients]);

  // Expose refresh function to parent components if needed
  useEffect(() => {
    // @ts-expect-error - Exposing refresh function globally for debugging
    window.refreshClients = refreshClients;

    return () => {
      // @ts-expect-error - Clean up global function
      delete window.refreshClients;
    };
  }, [user?.access_token, refreshClients]);

  // Listen for navigation events and refresh clients when needed
  useEffect(() => {
    const handleNavigation = () => {
      // Small delay to ensure the component is fully mounted
      setTimeout(() => {
        if (user?.access_token && clients.length === 0) {
          console.log('Navigation detected, refreshing clients...');
          loadClients();
        }
      }, 100);
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleNavigation);

    // Listen for pushstate (programmatic navigation)
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleNavigation();
    };

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      history.pushState = originalPushState;
    };
  }, [user?.access_token, clients.length, loadClients]);

  const filterAndSortClients = useCallback(() => {
    let filtered = [...clients];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(client =>
        client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.birthPlace?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(client => client.language === languageFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(client => {
            const clientDate = new Date(client.createdAt);
            return !isNaN(clientDate.getTime()) && clientDate >= filterDate;
          });
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(client => {
            const clientDate = new Date(client.createdAt);
            return !isNaN(clientDate.getTime()) && clientDate >= filterDate;
          });
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(client => {
            const clientDate = new Date(client.createdAt);
            return !isNaN(clientDate.getTime()) && clientDate >= filterDate;
          });
          break;
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;

      switch (sortBy) {
        case 'name':
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          // Handle invalid dates by putting them at the end
          if (isNaN(aValue.getTime())) aValue = new Date(0);
          if (isNaN(bValue.getTime())) bValue = new Date(0);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'bookings':
          aValue = a.totalBookings || 0;
          bValue = b.totalBookings || 0;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredClients(filtered);
  }, [clients, searchQuery, statusFilter, languageFilter, dateFilter, sortBy, sortOrder]);

  useEffect(() => {
    filterAndSortClients();
  }, [clients, searchQuery, statusFilter, languageFilter, dateFilter, sortBy, sortOrder, filterAndSortClients]);

  const handleCreateClient = () => {
    setSelectedClient(null);
    setModalState({ isOpen: true, mode: 'create' });
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setModalState({ isOpen: true, mode: 'edit' });
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setModalState({ isOpen: true, mode: 'view' });
  };

  const handleViewHistory = (client: Client) => {
    setSelectedClient(client);
    setModalState({ isOpen: true, mode: 'history' });
  };

  const handleCreateBooking = (client: Client) => {
    setSelectedClientForBooking(client);
    setShowCreateBookingModal(true);
  };

  const handleDeleteClient = async (client: Client) => {
    if (!user?.access_token) return;
    
    if (!confirm(`Are you sure you want to delete ${client.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${client.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setClients(prev => prev.filter(c => c.id !== client.id));
        toast.success('Client deleted successfully', {
          description: `${client.fullName} has been removed from your client list.`
        });
      } else {
        const errorData = await response.json();
        toast.error('Failed to delete client', {
          description: errorData.message || 'Please try again.'
        });
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Network error', {
        description: 'Failed to delete client. Please check your connection and try again.'
      });
    }
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    if (!user?.access_token) return;

    try {
      const isCreate = modalState.mode === 'create';
      const url = isCreate 
        ? `/api/admin/users`
        : `/api/admin/users/${selectedClient?.id}`;

      const response = await fetch(url, {
        method: isCreate ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (isCreate) {
          setClients(prev => [data.client, ...prev]);
          toast.success('Client created successfully!', {
            description: `${data.client.name} has been added to your client list.`
          });
        } else {
          setClients(prev => prev.map(c => 
            c.id === selectedClient?.id ? { ...c, ...data.client } : c
          ));
          toast.success('Client updated successfully!', {
            description: `${data.client.name}'s information has been updated.`
          });
        }
        
        setModalState({ isOpen: false, mode: 'view' });
        setSelectedClient(null);
      } else {
        const errorData = await response.json();
        toast.error('Failed to save client', {
          description: errorData.message || 'Please try again.'
        });
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Network error', {
        description: 'Failed to save client. Please check your connection and try again.'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
      'confirmed': { color: 'bg-blue-500/20 text-blue-400', label: 'Confirmed' },
      'completed': { color: 'bg-green-500/20 text-green-400', label: 'Completed' },
      'cancelled': { color: 'bg-red-500/20 text-red-400', label: 'Cancelled' },
      'no-show': { color: 'bg-gray-500/20 text-gray-400', label: 'No Show' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const stats = {
    total: clients.length,
    pending: clients.filter(c => c.status === 'pending').length,
    confirmed: clients.filter(c => c.status === 'confirmed').length,
    completed: clients.filter(c => c.status === 'completed').length,
    recurrent: clients.filter(c => c.isRecurrent).length
  };
  
  console.log('Stats calculation:', {
    total: clients.length,
    pending: clients.filter(c => c.status === 'pending').length,
    confirmed: clients.filter(c => c.status === 'confirmed').length,
    completed: clients.filter(c => c.status === 'completed').length,
    recurrent: clients.filter(c => c.isRecurrent).length
  });
  console.log('All client statuses:', clients.map(c => ({ name: c.fullName, status: c.status })));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading client management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading text-white mb-2">Client Management</h2>
          <p className="text-gray-400">Manage your astrology consultation clients</p>
        </div>
        <BaseButton
          onClick={handleCreateClient}
          className="dashboard-button-primary"
        >
          <Plus size={16} className="mr-2" />
          Add Client
        </BaseButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Clients</p>
                <p className="text-2xl font-heading text-white">{stats.total}</p>
              </div>
              <Users size={24} className="text-[#ffd700]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-heading text-yellow-400">{stats.pending}</p>
              </div>
              <Clock size={24} className="text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Confirmed</p>
                <p className="text-2xl font-heading text-blue-400">{stats.confirmed}</p>
              </div>
              <CheckCircle size={24} className="text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-heading text-green-400">{stats.completed}</p>
              </div>
              <CheckCircle size={24} className="text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Recurrent</p>
                <p className="text-2xl font-heading text-[#ffd700]">{stats.recurrent}</p>
              </div>
              <Star size={24} className="text-[#ffd700]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-[#1a1a2e] border-[#16213e]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-end">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label className="text-gray-400 text-sm">Search</Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400/50" />
                <BaseInput
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#1a1a2e] border-[#16213e] text-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-gray-400 text-sm">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#1a1a2e] border-[#16213e] text-white">
                  <SelectValue />
                </SelectTrigger>
                                  <SelectContent className="dashboard-dropdown-content">
                    <SelectItem value="all" className="dashboard-dropdown-item">All Status</SelectItem>
                    <SelectItem value="active" className="dashboard-dropdown-item">Active</SelectItem>
                    <SelectItem value="pending" className="dashboard-dropdown-item">Pending</SelectItem>
                    <SelectItem value="confirmed" className="dashboard-dropdown-item">Confirmed</SelectItem>
                    <SelectItem value="completed" className="dashboard-dropdown-item">Completed</SelectItem>
                    <SelectItem value="cancelled" className="dashboard-dropdown-item">Cancelled</SelectItem>
                    <SelectItem value="no-show" className="dashboard-dropdown-item">No Show</SelectItem>
                    <SelectItem value="inactive" className="dashboard-dropdown-item">Inactive</SelectItem>
                  </SelectContent>
              </Select>
            </div>

            {/* Language Filter */}
            <div>
              <Label className="text-gray-400 text-sm">Language</Label>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="bg-[#1a1a2e] border-[#16213e] text-white">
                  <SelectValue />
                </SelectTrigger>
                                  <SelectContent className="dashboard-dropdown-content">
                    <SelectItem value="all" className="dashboard-dropdown-item">All Languages</SelectItem>
                    <SelectItem value="en" className="dashboard-dropdown-item">🇺🇸 English</SelectItem>
                    <SelectItem value="es" className="dashboard-dropdown-item">🇪🇸 Español</SelectItem>
                  </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div>
              <Label className="text-[#C0C0C0] text-sm">Date</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-[#1a1a2e] border-[#16213e] text-white">
                  <SelectValue />
                </SelectTrigger>
                                  <SelectContent className="dashboard-dropdown-content">
                    <SelectItem value="all" className="dashboard-dropdown-item">All Time</SelectItem>
                    <SelectItem value="today" className="dashboard-dropdown-item">Today</SelectItem>
                    <SelectItem value="week" className="dashboard-dropdown-item">This Week</SelectItem>
                    <SelectItem value="month" className="dashboard-dropdown-item">This Month</SelectItem>
                  </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <Label className="text-gray-400 text-sm">Sort By</Label>
              <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'status') => setSortBy(value)}>
                <SelectTrigger className="bg-[#1a1a2e] border-[#16213e] text-white">
                  <SelectValue />
                </SelectTrigger>
                                  <SelectContent className="dashboard-dropdown-content">
                    <SelectItem value="date" className="dashboard-dropdown-item">Date Created</SelectItem>
                    <SelectItem value="name" className="dashboard-dropdown-item">Name</SelectItem>
                    <SelectItem value="status" className="dashboard-dropdown-item">Status</SelectItem>
                    <SelectItem value="bookings" className="dashboard-dropdown-item">Total Bookings</SelectItem>
                  </SelectContent>
              </Select>
            </div>

            {/* Sort Order & View Mode */}
            <div className="flex space-x-2">
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
              >
                <ArrowUpDown size={16} />
              </BaseButton>
              <div className="flex bg-[#1a1a2e] rounded-lg border border-[#16213e]">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'dashboard-button-toggle-active' : 'dashboard-button-toggle-inactive'}
                >
                  <List size={16} />
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'dashboard-button-toggle-active' : 'dashboard-button-toggle-inactive'}
                >
                  <Grid size={16} />
                </BaseButton>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <p className="text-sm text-gray-400">
            Showing {filteredClients.length} of {clients.length} clients
          </p>
          {lastLoaded && (
            <p className="text-xs text-gray-400/60">
              Last loaded: {lastLoaded.toLocaleTimeString()}
            </p>
          )}
        </div>
        <BaseButton
          size="sm"
          onClick={loadClients}
          className="dashboard-button-reload"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </BaseButton>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-[#ffd700] border-t-transparent rounded-full mx-auto mb-4"
            />
            <h3 className="text-lg font-heading text-white mb-2">Loading clients...</h3>
            <p className="text-gray-400">Please wait while we fetch your client data.</p>
          </CardContent>
        </Card>
      )}

      {/* Client List/Grid */}
      {!isLoading && filteredClients.length === 0 ? (
        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-12 text-center">
            <Users size={48} className="mx-auto text-gray-400/50 mb-4" />
            <h3 className="text-lg font-heading text-white mb-2">No clients found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || statusFilter !== 'all' || languageFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first client.'}
            </p>
            {!searchQuery && statusFilter === 'all' && languageFilter === 'all' && dateFilter === 'all' && (
              <BaseButton
                onClick={handleCreateClient}
                className="dashboard-button-primary"
              >
                <Plus size={16} className="mr-2" />
                Add First Client
              </BaseButton>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="bg-[#1a1a2e] border-[#16213e]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#2a2a4a]">
                  <tr className="text-left">
                    <th className="p-4 text-sm font-medium text-gray-400">Client</th>
                    <th className="p-4 text-sm font-medium text-gray-400">Contact</th>
                    <th className="p-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="p-4 text-sm font-medium text-gray-400">Bookings</th>
                    <th className="p-4 text-sm font-medium text-gray-400">Created</th>
                    <th className="p-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-[#2a2a4a]/30 hover:bg-[#1a1a2e]/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                            <User size={16} className="text-[#FFD700]" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{client.fullName}</p>
                            <p className="text-sm text-gray-400">
                              {client.language === 'en' ? '🇺🇸' : '🇪🇸'} {client.birthPlace}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white">{client.email}</p>
                                                      <p className="text-sm text-gray-400">
                              Born: {formatDate(client.birthDate)}
                            </p>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-white">{client.totalBookings || 0}</span>
                          {client.isRecurrent && (
                            <Star size={14} className="text-[#FFD700]" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white">
                          {formatDate(client.createdAt)}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <BaseButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClient(client)}
                            className="border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
                          >
                            <Eye size={14} />
                          </BaseButton>
                          <BaseButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClient(client)}
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            <Edit size={14} />
                          </BaseButton>
                          {(client.totalBookings || 0) > 0 && (
                            <BaseButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewHistory(client)}
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            >
                              <History size={14} />
                            </BaseButton>
                          )}
                          <BaseButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClient(client)}
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="bg-[#1a1a2e] border-[#16213e] hover:border-[#ffd700]/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                      <User size={20} className="text-[#FFD700]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{client.fullName}</h3>
                      <p className="text-sm text-gray-400">
                        {client.language === 'en' ? '🇺🇸' : '🇪🇸'} {client.email}
                      </p>
                    </div>
                  </div>
                  {client.isRecurrent && (
                                                <Star size={16} className="text-[#FFD700]" />
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Status:</span>
                    {getStatusBadge(client.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Bookings:</span>
                    <span className="text-white">{client.totalBookings || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Birth Date:</span>
                    <span className="text-white">
                      {formatDate(client.birthDate)}
                    </span>
                  </div>
                  {client.birthPlace && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Birth Place:</span>
                      <span className="text-white text-sm">{client.birthPlace}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <BaseButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewClient(client)}
                    className="flex-1 border-[#2a2a4a] text-gray-400 hover:bg-[#2a2a4a] hover:text-white"
                  >
                    <Eye size={14} className="mr-2" />
                    View
                  </BaseButton>
                  <BaseButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateBooking(client)}
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    <Calendar size={14} className="mr-2" />
                    Book
                  </BaseButton>
                  <BaseButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClient(client)}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <Edit size={14} />
                  </BaseButton>
                  {(client.totalBookings || 0) > 0 && (
                    <BaseButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewHistory(client)}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <History size={14} />
                    </BaseButton>
                  )}
                  <BaseButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClient(client)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </BaseButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modalState.mode === 'history' ? (
          <BookingHistoryModal
            client={selectedClient}
            isOpen={modalState.isOpen}
            onClose={() => {
              setModalState({ isOpen: false, mode: 'view' });
              setSelectedClient(null);
            }}
          />
        ) : (
          <ClientModal
            client={selectedClient}
            isOpen={modalState.isOpen}
            mode={modalState.mode as 'create' | 'edit' | 'view'}
            onClose={() => {
              setModalState({ isOpen: false, mode: 'view' });
              setSelectedClient(null);
            }}
            onSave={handleSaveClient}
          />
        )}
      </AnimatePresence>

      {/* Create Booking Modal */}
      {selectedClientForBooking && (
        <CreateBookingModal
          isOpen={showCreateBookingModal}
          onClose={() => {
            setShowCreateBookingModal(false);
            setSelectedClientForBooking(null);
          }}
          client={selectedClientForBooking}
          onSuccess={() => {
            // Refresh clients to update booking counts
            loadClients();
          }}
        />
      )}
    </div>
  );
}