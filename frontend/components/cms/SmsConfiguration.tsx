'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  TestTube, 
  CheckCircle, 
  Loader2,
  Eye,
  EyeOff,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { useToast } from './Toast';

interface SmsConfiguration {
  id?: number;
  provider: string;
  username: string;
  tokenApi: string;
  senderName: string;
  isActive: boolean;
}

interface SmsBalance {
  code: number;
  credits: string;
}

export function SmsConfiguration() {
  const [config, setConfig] = useState<SmsConfiguration>({
    provider: 'labsmobile',
    username: '',
    tokenApi: '',
    senderName: 'SoulPath',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [balance, setBalance] = useState<SmsBalance | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test SMS from SoulPath');
  const toast = useToast();

  // Load existing configuration
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/sms-config');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Failed to load SMS configuration:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/sms-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.showSuccess(
          'SMS Configuration Saved',
          'Your SMS settings have been updated successfully.'
        );
        await loadConfiguration();
      } else {
        const error = await response.json();
        toast.showError(
          'Save Failed',
          error.error || 'Failed to save SMS configuration.'
        );
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.showError(
        'Save Failed',
        'Network error. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/admin/sms-config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: config.username,
          tokenApi: config.tokenApi,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBalance(data.balance);
        toast.showSuccess(
          'Connection Successful',
          `Balance: ${data.balance.credits} credits`
        );
      } else {
        toast.showError(
          'Connection Failed',
          data.error || 'Failed to connect to LabsMobile API.'
        );
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast.showError(
        'Connection Failed',
        'Network error. Please try again.'
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!testPhone.trim()) {
      toast.showError(
        'Phone Number Required',
        'Please enter a phone number for testing.'
      );
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/admin/sms-config/test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: testPhone,
          message: testMessage,
          username: config.username,
          tokenApi: config.tokenApi,
          senderName: config.senderName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.showSuccess(
          'Test SMS Sent',
          `SMS sent successfully to ${testPhone}`
        );
      } else {
        toast.showError(
          'SMS Send Failed',
          data.error || 'Failed to send test SMS.'
        );
      }
    } catch (error) {
      console.error('Send test SMS error:', error);
      toast.showError(
        'SMS Send Failed',
        'Network error. Please try again.'
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-heading text-gray-900">SMS Configuration</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              LabsMobile Settings
            </CardTitle>
            <CardDescription>
              Configure your LabsMobile API credentials for SMS OTP verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={config.provider}
                onChange={(e) => setConfig(prev => ({ ...prev, provider: e.target.value }))}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Currently only LabsMobile is supported</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Your LabsMobile username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tokenApi">API Token</Label>
              <div className="relative">
                <Input
                  id="tokenApi"
                  type={showToken ? 'text' : 'password'}
                  value={config.tokenApi}
                  onChange={(e) => setConfig(prev => ({ ...prev, tokenApi: e.target.value }))}
                  placeholder="Your LabsMobile API token"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                value={config.senderName}
                onChange={(e) => setConfig(prev => ({ ...prev, senderName: e.target.value }))}
                placeholder="SMS sender name (e.g., SoulPath)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={config.isActive}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Enable SMS Service</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={isLoading || !config.username || !config.tokenApi}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Testing & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Test & Status
            </CardTitle>
            <CardDescription>
              Test your SMS configuration and check account status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Test */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Connection Test</h4>
              <Button
                onClick={handleTestConnection}
                disabled={isTesting || !config.username || !config.tokenApi}
                variant="outline"
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Test Connection
                  </>
                )}
              </Button>

              {balance && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Connected Successfully
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Account Balance: {balance.credits} credits
                  </p>
                </div>
              )}
            </div>

            {/* Test SMS */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Send Test SMS</h4>
              <div className="space-y-2">
                <Label htmlFor="testPhone">Phone Number</Label>
                <Input
                  id="testPhone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testMessage">Message</Label>
                <Input
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Test message content"
                />
              </div>
              <Button
                onClick={handleSendTestSms}
                disabled={isTesting || !testPhone.trim() || !config.username || !config.tokenApi}
                variant="outline"
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Smartphone size={16} className="mr-2" />
                    Send Test SMS
                  </>
                )}
              </Button>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Service Status</h4>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-700">
                  SMS Service: {config.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {config.id && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-700">
                    Configuration: Saved
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
