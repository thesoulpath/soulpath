'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { 
  ConversationLog, 
  ConversationStats, 
  ConversationLogsResponse 
} from '@/lib/types/conversational-orchestrator';
import { badgeStyles, combineStyles } from '@/lib/styles/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Download, 
  Filter, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Brain,
  Star
} from 'lucide-react';


export default function ConversationLogsManagement() {
  const { user, isLoading, isAdmin } = useAuth();
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    dateFrom: '',
    dateTo: '',
    intent: '',
    confidence: '',
    hasFeedback: '',
    page: 1,
    limit: 50
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Move useEffect before any conditional returns
  useEffect(() => {
    if (user?.access_token) {
      fetchConversationLogs();
    }
  }, [filters, user?.access_token]);

  // Show loading state while authentication is being verified
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-500)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message if user is not authenticated
  if (!user || !user.access_token) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Authentication Required
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-4">
            Please sign in to access conversation logs.
          </p>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Use the admin access button in the main navigation to sign in.
          </p>
        </div>
      </div>
    );
  }

  // Show admin access required message if user is not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Admin Access Required
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            You need admin privileges to access conversation logs.
          </p>
        </div>
      </div>
    );
  }

  const fetchConversationLogs = async () => {
    if (!user?.access_token) {
      console.error('No authentication token available - user not authenticated');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      console.log('🔍 Fetching conversation logs with params:', params.toString());
      console.log('🔍 Auth token available:', !!user.access_token);

      const response = await fetch(`/api/admin/conversation-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
        },
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return;
      }

      const data: ConversationLogsResponse = await response.json();
      console.log('🔍 API Response data:', data);

      if (data.success) {
        setLogs(data.data);
        setStats(data.statistics);
        setPagination(data.pagination);
        console.log('✅ Successfully loaded conversation logs:', data.data.length);
      } else {
        console.error('❌ Failed to fetch conversation logs:', {
          success: data.success,
          error: data.error,
          message: data.message,
          fullResponse: data
        });
      }
    } catch (error) {
      console.error('❌ Network/Parse error fetching conversation logs:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleSelectLog = (logId: number) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLogs.length === logs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(logs.map(log => log.id));
    }
  };

  const markForTraining = async () => {
    if (selectedLogs.length === 0) return;

    try {
      const response = await fetch('/api/admin/conversation-logs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          action: 'mark_for_training',
          logIds: selectedLogs
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Marked ${data.data.updatedCount} logs for training`);
        setSelectedLogs([]);
        fetchConversationLogs();
      }
    } catch (error) {
      console.error('Error marking logs for training:', error);
    }
  };

  const exportTrainingData = async () => {
    if (selectedLogs.length === 0) return;

    try {
      const response = await fetch('/api/admin/conversation-logs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          action: 'export_training_data',
          logIds: selectedLogs
        })
      });

      const data = await response.json();
      if (data.success) {
        // Download the training data
        const blob = new Blob([data.data.content], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training_data_${Date.now()}.yml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting training data:', error);
    }
  };

  const testConnection = async () => {
    if (!user?.access_token) {
      alert('❌ No authentication token available. Please sign in first.');
      return;
    }

    try {
      console.log('🔍 Testing connection...');
      const response = await fetch('/api/admin/health', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
        },
      });

      const data = await response.json();
      console.log('🔍 Health check response:', data);
      
      if (data.success) {
        alert(`✅ Connection test successful!\n\nDatabase: ${data.data.database.status}\nRecords: ${data.data.database.recordCount}\nUser: ${data.data.authentication.user.email}`);
      } else {
        alert(`❌ Connection test failed: ${data.error || data.message}`);
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
      alert(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testDatabase = async () => {
    try {
      console.log('🔍 Testing database...');
      const response = await fetch('/api/test/db');
      const data = await response.json();
      console.log('🔍 Database test response:', data);
      
      if (data.success) {
        const userCount = data.data.userCount;
        const users = data.data.users;
        
        let message = `✅ Database test successful!\n\nUsers: ${userCount}\n\n`;
        
        if (users.length > 0) {
          message += 'Existing users:\n';
          users.forEach((u: any) => {
            message += `• ${u.email} (${u.role}) - ${u.hasPassword ? 'Has password' : 'No password'}\n`;
          });
        } else {
          message += 'No users found. You may need to create a test user.';
        }
        
        alert(message);
      } else {
        alert(`❌ Database test failed: ${data.error || data.message}`);
      }
    } catch (error) {
      console.error('❌ Database test error:', error);
      alert(`❌ Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createTestUser = async () => {
    const email = prompt('Enter email for test user:');
    const password = prompt('Enter password for test user:');
    const fullName = prompt('Enter full name (optional):') || 'Test User';
    const role = prompt('Enter role (admin/user):') || 'admin';

    if (!email || !password) {
      alert('❌ Email and password are required');
      return;
    }

    try {
      console.log('🔍 Creating test user...');
      const response = await fetch('/api/test/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName, role })
      });

      const data = await response.json();
      console.log('🔍 User creation response:', data);
      
      if (data.success) {
        alert(`✅ Test user created successfully!\n\nEmail: ${data.data.email}\nRole: ${data.data.role}\nID: ${data.data.id}`);
      } else {
        alert(`❌ User creation failed: ${data.error || data.message}`);
      }
    } catch (error) {
      console.error('❌ User creation error:', error);
      alert(`❌ User creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testPrisma = async () => {
    try {
      console.log('🔍 Testing Prisma client...');
      const response = await fetch('/api/test/prisma');
      const data = await response.json();
      console.log('🔍 Prisma test response:', data);
      
      if (data.success) {
        const results = data.data.testQueryResults;
        alert(`✅ Prisma test successful!\n\nConnection: ${data.data.connectionStatus}\nUser Count: ${results.countQuery}\nFind Many: ${results.findManyQuery}\nFind Unique: ${results.findUniqueQuery}\nRaw Query: ${JSON.stringify(results.rawQuery)}`);
      } else {
        alert(`❌ Prisma test failed: ${data.error || data.message}\n\nDetails: ${data.details || 'No details available'}`);
      }
    } catch (error) {
      console.error('❌ Prisma test error:', error);
      alert(`❌ Prisma test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge variant="default" className={badgeStyles.success}>High</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge variant="secondary" className={badgeStyles.warning}>Medium</Badge>;
    } else {
      return <Badge variant="destructive" className={badgeStyles.error}>Low</Badge>;
    }
  };

  const getFeedbackIcon = (feedback?: any) => {
    if (!feedback) return <XCircle className="h-4 w-4 text-[var(--color-text-tertiary)]" />;
    
    if (feedback.rating >= 4) {
      return <CheckCircle className="h-4 w-4 text-[var(--color-status-success)]" />;
    } else if (feedback.rating >= 2) {
      return <AlertTriangle className="h-4 w-4 text-[var(--color-status-warning)]" />;
    } else {
      return <XCircle className="h-4 w-4 text-[var(--color-status-error)]" />;
    }
  };

  return (
    <div className="dashboard-container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dashboard-text-primary text-3xl font-bold">Conversation Logs</h1>
          <p className="dashboard-text-secondary">Monitor and analyze conversation logs from the AI assistant</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchConversationLogs} 
            disabled={loading}
            className="dashboard-button-outline"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">Total Logs</CardTitle>
              <MessageSquare className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dashboard-text-primary">{stats.totalLogs.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">Low Confidence</CardTitle>
              <AlertTriangle className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--color-status-error)]">{stats.lowConfidenceLogs}</div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {((stats.lowConfidenceLogs / stats.totalLogs) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dashboard-text-primary">
                {(stats.averageConfidence * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">With Feedback</CardTitle>
              <Star className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dashboard-text-primary">{stats.logsWithFeedback}</div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {((stats.logsWithFeedback / stats.totalLogs) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="dashboard-tabs">
          <TabsTrigger value="logs" className="dashboard-tab">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversation Logs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="dashboard-tab">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="dashboard-card-title flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="userId" className="dashboard-label">User ID</Label>
                  <Input
                    id="userId"
                    placeholder="Filter by user ID"
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    className="dashboard-input"
                  />
                </div>

                <div className="flex-1">
                  <Label htmlFor="intent" className="dashboard-label">Intent</Label>
                  <Input
                    id="intent"
                    placeholder="Filter by intent"
                    value={filters.intent}
                    onChange={(e) => handleFilterChange('intent', e.target.value)}
                    className="dashboard-input"
                  />
                </div>

                <div className="flex-1">
                  <Label htmlFor="confidence" className="dashboard-label">Max Confidence</Label>
                  <Input
                    id="confidence"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    placeholder="0.0 - 1.0"
                    value={filters.confidence}
                    className="dashboard-input"
                    onChange={(e) => handleFilterChange('confidence', e.target.value)}
                  />
                </div>

                <div className="flex-1">
                  <Label htmlFor="hasFeedback" className="dashboard-label">Feedback</Label>
                  <Select
                    value={filters.hasFeedback}
                    onValueChange={(value) => handleFilterChange('hasFeedback', value)}
                  >
                    <SelectTrigger className="dashboard-select">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="dashboard-dropdown-content">
                      <SelectItem value="all" className="dashboard-dropdown-item">All</SelectItem>
                      <SelectItem value="true" className="dashboard-dropdown-item">With Feedback</SelectItem>
                      <SelectItem value="false" className="dashboard-dropdown-item">No Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label htmlFor="dateFrom" className="dashboard-label">Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="dashboard-input"
                  />
                </div>

                <div className="flex-1">
                  <Label htmlFor="dateTo" className="dashboard-label">Date To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="dashboard-input"
                  />
                </div>

                <Button 
                  onClick={fetchConversationLogs}
                  className="dashboard-button-outline"
                  variant="outline"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {selectedLogs.length > 0 && (
            <Card className="dashboard-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {selectedLogs.length} logs selected
                  </span>
                  <Button 
                    onClick={markForTraining} 
                    size="sm"
                    className="dashboard-button-primary"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Mark for Training
                  </Button>
                  <Button 
                    onClick={exportTrainingData} 
                    size="sm" 
                    variant="outline"
                    className="dashboard-button-outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Training Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs Table */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="dashboard-card-title">Conversation Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="dashboard-table">
                  <TableHeader className="dashboard-table-header">
                    <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedLogs.length === logs.length && logs.length > 0}
                        onChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(log.id)}
                          onChange={() => handleSelectLog(log.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.userId || 'Anonymous'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.userMessage}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.rasaIntent}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getConfidenceBadge(log.rasaConfidence || 0)}
                          <span className="text-xs">
                            {((log.rasaConfidence || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getFeedbackIcon(log.feedback?.[0])}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Conversation Log Details</DialogTitle>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>User ID</Label>
                                    <p className="font-mono text-sm">{selectedLog.userId || 'Anonymous'}</p>
                                  </div>
                                  <div>
                                    <Label>Timestamp</Label>
                                    <p className="text-sm">
                                      {new Date(selectedLog.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Intent</Label>
                                    <Badge variant="outline">{selectedLog.rasaIntent}</Badge>
                                  </div>
                                  <div>
                                    <Label>Confidence</Label>
                                    <div className="flex items-center gap-2">
                                      {getConfidenceBadge(selectedLog.rasaConfidence || 0)}
                                      <span>{((selectedLog.rasaConfidence || 0) * 100).toFixed(1)}%</span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label>User Message</Label>
                                  <Textarea
                                    value={selectedLog.userMessage}
                                    readOnly
                                    className="min-h-[100px]"
                                  />
                                </div>

                                <div>
                                  <Label>Bot Response</Label>
                                  <Textarea
                                    value={selectedLog.botResponse || ''}
                                    readOnly
                                    className="min-h-[100px]"
                                  />
                                </div>

                                {selectedLog.rasaEntities && selectedLog.rasaEntities.length > 0 && (
                                  <div>
                                    <Label>Entities</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedLog.rasaEntities.map((entity, index) => (
                                        <Badge key={index} variant="secondary">
                                          {entity.entity}: {entity.value}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {selectedLog.feedback && selectedLog.feedback.length > 0 && (
                                  <div>
                                    <Label>User Feedback</Label>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span>Rating:</span>
                                        <div className="flex">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`h-4 w-4 ${
                                                i < selectedLog.feedback![0].rating
                                                  ? 'text-[var(--color-status-warning)] fill-current'
                                                  : 'text-[var(--color-text-tertiary)]'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      <Textarea
                                        value={selectedLog.feedback[0].comment || ''}
                                        readOnly
                                        className="min-h-[80px]"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="dashboard-button-outline"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="dashboard-button-outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="dashboard-card-title">Top Intents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topIntents.map((intent) => (
                      <div key={intent.intent} className="flex items-center justify-between">
                        <span className="text-sm text-[var(--color-text-primary)]">{intent.intent}</span>
                        <Badge variant="outline">{intent.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="dashboard-card-title">Confidence Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--color-text-primary)]">High Confidence (≥80%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-[var(--color-surface-tertiary)] rounded-full h-2">
                          <div
                            className="bg-[var(--color-status-success)] h-2 rounded-full"
                            style={{
                              width: `${(stats.highConfidenceLogs / stats.totalLogs) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-[var(--color-text-primary)]">{stats.highConfidenceLogs}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--color-text-primary)]">Low Confidence (≤60%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-[var(--color-surface-tertiary)] rounded-full h-2">
                          <div
                            className="bg-[var(--color-status-error)] h-2 rounded-full"
                            style={{
                              width: `${(stats.lowConfidenceLogs / stats.totalLogs) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-[var(--color-text-primary)]">{stats.lowConfidenceLogs}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
