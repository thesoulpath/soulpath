'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Video, Settings, Save, TestTube, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface LiveSessionConfig {
  id: string;
  name: string;
  provider: 'zoom' | 'meet' | 'teams' | 'weebly' | 'custom';
  apiKey: string;
  apiSecret?: string;
  webhookUrl?: string;
  isActive: boolean;
  settings: {
    allowVideo: boolean;
    allowAudio: boolean;
    allowChat: boolean;
    allowScreenShare: boolean;
    maxParticipants: number;
    recordingEnabled: boolean;
    autoStart: boolean;
    waitingRoom: boolean;
    muteOnEntry: boolean;
  };
  weeblySettings?: {
    siteId: string;
    appId: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string[];
  };
}

const PROVIDERS = [
  { value: 'zoom', label: 'Zoom', description: 'Zoom Video Communications' },
  { value: 'meet', label: 'Google Meet', description: 'Google Meet integration' },
  { value: 'teams', label: 'Microsoft Teams', description: 'Microsoft Teams integration' },
  { value: 'weebly', label: 'Weebly', description: 'Weebly API integration' },
  { value: 'custom', label: 'Custom', description: 'Custom video conferencing solution' }
];

const WEBEBBLY_SCOPES = [
  'read:site',
  'write:site',
  'read:blog',
  'write:blog',
  'read:store',
  'write:store',
  'read:user',
  'write:user'
];

export default function LiveSessionConfigPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<LiveSessionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    provider: 'zoom' as 'zoom' | 'meet' | 'teams' | 'weebly' | 'custom',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    isActive: true,
    allowVideo: true,
    allowAudio: true,
    allowChat: true,
    allowScreenShare: true,
    maxParticipants: 10,
    recordingEnabled: true,
    autoStart: false,
    waitingRoom: true,
    muteOnEntry: false,
    // Weebly specific settings
    siteId: '',
    appId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scope: ['read:site', 'write:site'] as string[]
  });

  const loadConfig = useCallback(async () => {
    if (!user?.access_token) return;

    try {
      const response = await fetch('/api/admin/live-session-config', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig(data.data);
          setFormData({
            name: data.data.name || '',
            provider: data.data.provider || 'zoom',
            apiKey: data.data.apiKey || '',
            apiSecret: data.data.apiSecret || '',
            webhookUrl: data.data.webhookUrl || '',
            isActive: data.data.isActive || false,
            allowVideo: data.data.settings?.allowVideo || true,
            allowAudio: data.data.settings?.allowAudio || true,
            allowChat: data.data.settings?.allowChat || true,
            allowScreenShare: data.data.settings?.allowScreenShare || true,
            maxParticipants: data.data.settings?.maxParticipants || 10,
            recordingEnabled: data.data.settings?.recordingEnabled || false,
            autoStart: data.data.settings?.autoStart || false,
            waitingRoom: data.data.settings?.waitingRoom || true,
            muteOnEntry: data.data.settings?.muteOnEntry || false,
            siteId: data.data.weeblySettings?.siteId || '',
            appId: data.data.weeblySettings?.appId || '',
            clientId: data.data.weeblySettings?.clientId || '',
            clientSecret: data.data.weeblySettings?.clientSecret || '',
            redirectUri: data.data.weeblySettings?.redirectUri || '',
            scope: data.data.weeblySettings?.scope || ['read:site', 'write:site']
          });
        }
      }
    } catch (error) {
      console.error('Error loading live session config:', error);
      toast.error('Failed to load configuration');
    }
  }, [user?.access_token]);

  useEffect(() => {
    if (user?.access_token) {
      loadConfig();
    }
  }, [user?.access_token, loadConfig]);

  useEffect(() => {
    setLoading(false);
  }, [config]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScopeToggle = (scope: string) => {
    setFormData(prev => ({
      ...prev,
      scope: prev.scope.includes(scope)
        ? prev.scope.filter(s => s !== scope)
        : [...prev.scope, scope]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/live-session-config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          provider: formData.provider,
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
          webhookUrl: formData.webhookUrl,
          isActive: formData.isActive,
          settings: {
            allowVideo: formData.allowVideo,
            allowAudio: formData.allowAudio,
            allowChat: formData.allowChat,
            allowScreenShare: formData.allowScreenShare,
            maxParticipants: formData.maxParticipants,
            recordingEnabled: formData.recordingEnabled,
            autoStart: formData.autoStart,
            waitingRoom: formData.waitingRoom,
            muteOnEntry: formData.muteOnEntry
          },
          weeblySettings: formData.provider === 'weebly' ? {
            siteId: formData.siteId,
            appId: formData.appId,
            clientId: formData.clientId,
            clientSecret: formData.clientSecret,
            redirectUri: formData.redirectUri,
            scope: formData.scope
          } : undefined
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Configuration saved successfully');
        setConfig(result.data);
      } else {
        toast.error(result.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/live-session-config/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: formData.provider,
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
          weeblySettings: formData.provider === 'weebly' ? {
            siteId: formData.siteId,
            clientId: formData.clientId,
            clientSecret: formData.clientSecret
          } : undefined
        })
      });

      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Connection successful' : 'Connection failed')
      });
      
      if (result.success) {
        toast.success('Test connection successful');
      } else {
        toast.error('Test connection failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult({
        success: false,
        message: 'Test connection failed'
      });
      toast.error('Test connection failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-lg font-semibold">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Live Session Configuration</h1>
        <p className="text-gray-400 text-lg">Configure video conferencing and Weebly API integration</p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Provider Selection */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Video className="w-5 h-5 text-[#ffd700]" />
                  <span>Video Conferencing Provider</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="provider" className="text-gray-300">Provider</Label>
                  <Select value={formData.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                    <SelectTrigger className="bg-[#16213e] border-[#0a0a23] text-white">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#16213e] border-[#0a0a23] text-white">
                      {PROVIDERS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          <div>
                            <div className="font-medium">{provider.label}</div>
                            <div className="text-sm text-gray-400">{provider.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name" className="text-gray-300">Configuration Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-[#16213e] border-[#0a0a23] text-white"
                    placeholder="e.g., SoulPath Live Sessions"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive" className="text-gray-300">Active</Label>
                </div>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white">API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiKey" className="text-gray-300">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    className="bg-[#16213e] border-[#0a0a23] text-white"
                    placeholder="Enter your API key"
                  />
                </div>

                {formData.provider !== 'weebly' && (
                  <div>
                    <Label htmlFor="apiSecret" className="text-gray-300">API Secret</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      value={formData.apiSecret}
                      onChange={(e) => handleInputChange('apiSecret', e.target.value)}
                      className="bg-[#16213e] border-[#0a0a23] text-white"
                      placeholder="Enter your API secret"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="webhookUrl" className="text-gray-300">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={formData.webhookUrl}
                    onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                    className="bg-[#16213e] border-[#0a0a23] text-white"
                    placeholder="https://your-domain.com/api/webhooks/live-session"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Weebly Specific Configuration */}
            {formData.provider === 'weebly' && (
              <Card className="bg-[#1a1a2e] border-[#16213e]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <ExternalLink className="w-5 h-5 text-[#ffd700]" />
                    <span>Weebly API Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="siteId" className="text-gray-300">Site ID</Label>
                      <Input
                        id="siteId"
                        value={formData.siteId}
                        onChange={(e) => handleInputChange('siteId', e.target.value)}
                        className="bg-[#16213e] border-[#0a0a23] text-white"
                        placeholder="Your Weebly site ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="appId" className="text-gray-300">App ID</Label>
                      <Input
                        id="appId"
                        value={formData.appId}
                        onChange={(e) => handleInputChange('appId', e.target.value)}
                        className="bg-[#16213e] border-[#0a0a23] text-white"
                        placeholder="Your Weebly app ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientId" className="text-gray-300">Client ID</Label>
                      <Input
                        id="clientId"
                        value={formData.clientId}
                        onChange={(e) => handleInputChange('clientId', e.target.value)}
                        className="bg-[#16213e] border-[#0a0a23] text-white"
                        placeholder="OAuth client ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientSecret" className="text-gray-300">Client Secret</Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        value={formData.clientSecret}
                        onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                        className="bg-[#16213e] border-[#0a0a23] text-white"
                        placeholder="OAuth client secret"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="redirectUri" className="text-gray-300">Redirect URI</Label>
                    <Input
                      id="redirectUri"
                      value={formData.redirectUri}
                      onChange={(e) => handleInputChange('redirectUri', e.target.value)}
                      className="bg-[#16213e] border-[#0a0a23] text-white"
                      placeholder="https://your-domain.com/auth/weebly/callback"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">OAuth Scopes</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {WEBEBBLY_SCOPES.map((scope) => (
                        <div key={scope} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={scope}
                            checked={formData.scope.includes(scope)}
                            onChange={() => handleScopeToggle(scope)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={scope} className="text-sm text-gray-300">
                            {scope}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Settings */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white">Session Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowVideo"
                      checked={formData.allowVideo}
                      onCheckedChange={(checked) => handleInputChange('allowVideo', checked)}
                    />
                    <Label htmlFor="allowVideo" className="text-gray-300">Allow Video</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowAudio"
                      checked={formData.allowAudio}
                      onCheckedChange={(checked) => handleInputChange('allowAudio', checked)}
                    />
                    <Label htmlFor="allowAudio" className="text-gray-300">Allow Audio</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowChat"
                      checked={formData.allowChat}
                      onCheckedChange={(checked) => handleInputChange('allowChat', checked)}
                    />
                    <Label htmlFor="allowChat" className="text-gray-300">Allow Chat</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowScreenShare"
                      checked={formData.allowScreenShare}
                      onCheckedChange={(checked) => handleInputChange('allowScreenShare', checked)}
                    />
                    <Label htmlFor="allowScreenShare" className="text-gray-300">Allow Screen Share</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="recordingEnabled"
                      checked={formData.recordingEnabled}
                      onCheckedChange={(checked) => handleInputChange('recordingEnabled', checked)}
                    />
                    <Label htmlFor="recordingEnabled" className="text-gray-300">Enable Recording</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoStart"
                      checked={formData.autoStart}
                      onCheckedChange={(checked) => handleInputChange('autoStart', checked)}
                    />
                    <Label htmlFor="autoStart" className="text-gray-300">Auto Start</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="waitingRoom"
                      checked={formData.waitingRoom}
                      onCheckedChange={(checked) => handleInputChange('waitingRoom', checked)}
                    />
                    <Label htmlFor="waitingRoom" className="text-gray-300">Waiting Room</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="muteOnEntry"
                      checked={formData.muteOnEntry}
                      onCheckedChange={(checked) => handleInputChange('muteOnEntry', checked)}
                    />
                    <Label htmlFor="muteOnEntry" className="text-gray-300">Mute on Entry</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxParticipants" className="text-gray-300">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 10)}
                    className="bg-[#16213e] border-[#0a0a23] text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Configuration</span>
                  <Badge className={config?.isActive ? 'bg-green-500' : 'bg-red-500'}>
                    {config?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Provider</span>
                  <span className="text-white">{formData.provider}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">API Key</span>
                  <span className="text-white">{formData.apiKey ? 'Set' : 'Not Set'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Test Connection */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white">Test Connection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleTest}
                  disabled={testing || !formData.apiKey}
                  className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
                >
                  {testing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      <span>Testing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <TestTube className="w-4 h-4" />
                      <span>Test Connection</span>
                    </div>
                  )}
                </Button>

                {testResult && (
                  <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                    testResult.success ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm ${
                      testResult.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {testResult.message}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-[#ffd700] text-black hover:bg-[#ffd700]/90 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save Configuration</span>
                    </div>
                  )}
                </Button>

                <Button
                  onClick={loadConfig}
                  variant="outline"
                  className="w-full bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23]"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Reset to Saved
                </Button>
              </CardContent>
            </Card>

            {/* Documentation */}
            <Card className="bg-[#1a1a2e] border-[#16213e]">
              <CardHeader>
                <CardTitle className="text-white">Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23]"
                  onClick={() => window.open('https://developers.zoom.us/docs/api/', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Zoom API Docs
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23]"
                  onClick={() => window.open('https://developers.google.com/meet/api', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Google Meet API
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-[#16213e] border-[#0a0a23] text-white hover:bg-[#0a0a23]"
                  onClick={() => window.open('https://staging-cloud-developer.weebly.com/', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Weebly API Docs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}
