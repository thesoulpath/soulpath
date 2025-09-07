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
  const { user } = useAuth();
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

  useEffect(() => {
    if (user?.access_token) {
      fetchConversationLogs();
    }
  }, [filters, user?.access_token]);

  const fetchConversationLogs = async () => {
    if (!user?.access_token) {
      console.error('No authentication token available');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/conversation-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
        },
      });
      const data: ConversationLogsResponse = await response.json();

      if (data.success) {
        setLogs(data.data);
        setStats(data.statistics);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch conversation logs:', data);
      }
    } catch (error) {
      console.error('Error fetching conversation logs:', error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Conversation Logs</h1>
        <div className="flex gap-2">
          <Button onClick={fetchConversationLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Confidence</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--color-status-error)]">{stats.lowConfidenceLogs}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.lowConfidenceLogs / stats.totalLogs) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.averageConfidence * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Feedback</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.logsWithFeedback}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.logsWithFeedback / stats.totalLogs) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Conversation Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    placeholder="Filter by user ID"
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="intent">Intent</Label>
                  <Input
                    id="intent"
                    placeholder="Filter by intent"
                    value={filters.intent}
                    onChange={(e) => handleFilterChange('intent', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="confidence">Max Confidence</Label>
                  <Input
                    id="confidence"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    placeholder="0.0 - 1.0"
                    value={filters.confidence}
                    onChange={(e) => handleFilterChange('confidence', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="hasFeedback">Feedback</Label>
                  <Select
                    value={filters.hasFeedback}
                    onValueChange={(value) => handleFilterChange('hasFeedback', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">With Feedback</SelectItem>
                      <SelectItem value="false">No Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="dateTo">Date To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {selectedLogs.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedLogs.length} logs selected
                  </span>
                  <Button onClick={markForTraining} size="sm">
                    <Brain className="h-4 w-4 mr-2" />
                    Mark for Training
                  </Button>
                  <Button onClick={exportTrainingData} size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Training Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
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

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
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
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
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
              <Card>
                <CardHeader>
                  <CardTitle>Top Intents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topIntents.map((intent) => (
                      <div key={intent.intent} className="flex items-center justify-between">
                        <span className="text-sm">{intent.intent}</span>
                        <Badge variant="outline">{intent.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Confidence Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Confidence (≥80%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-[var(--color-surface-tertiary)] rounded-full h-2">
                          <div
                            className="bg-[var(--color-status-success)] h-2 rounded-full"
                            style={{
                              width: `${(stats.highConfidenceLogs / stats.totalLogs) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm">{stats.highConfidenceLogs}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Low Confidence (≤60%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-[var(--color-surface-tertiary)] rounded-full h-2">
                          <div
                            className="bg-[var(--color-status-error)] h-2 rounded-full"
                            style={{
                              width: `${(stats.lowConfidenceLogs / stats.totalLogs) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm">{stats.lowConfidenceLogs}</span>
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
