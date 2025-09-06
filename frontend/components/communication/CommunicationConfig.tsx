'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BaseButton } from '../ui/BaseButton';
import { BaseInput } from '../ui/BaseInput';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Save, 
  TestTube, 
  Eye, 
  EyeOff, 
  Mail, 
  Smartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface CommunicationConfigData {
  // Email Configuration
  email_enabled: boolean;
  brevo_api_key: string;
  sender_email: string;
  sender_name: string;
  admin_email: string;
  
  // SMS Configuration
  sms_enabled: boolean;
  sms_provider: string;
  labsmobile_username: string;
  labsmobile_token: string;
  sms_sender_name: string;
}

export function CommunicationConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<CommunicationConfigData>({
    email_enabled: true,
    brevo_api_key: '',
    sender_email: 'noreply@soulpath.lat',
    sender_name: 'SOULPATH',
    admin_email: 'admin@soulpath.lat',
    sms_enabled: false,
    sms_provider: 'labsmobile',
    labsmobile_username: '',
    labsmobile_token: '',
    sms_sender_name: 'SoulPath'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmsToken, setShowSmsToken] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test message from SoulPath');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/communication/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/communication/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to save configuration' });
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailConnection = async () => {
    if (!testEmail) return;
    
    setIsTestingEmail(true);
    try {
      const response = await fetch('/api/admin/communication/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          type: 'email',
          to: testEmail,
          subject: 'Test Email from SoulPath',
          content: '<p>This is a test email to verify your email configuration.</p>'
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test email sent successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const testSmsConnection = async () => {
    if (!testPhone) return;
    
    setIsTestingSms(true);
    try {
      const response = await fetch('/api/admin/communication/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          type: 'sms',
          phoneNumber: testPhone,
          message: testMessage
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test SMS sent successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to send test SMS' });
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      setMessage({ type: 'error', text: 'Failed to send test SMS' });
    } finally {
      setIsTestingSms(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ffd700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="dashboard-text-secondary">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/20' 
            : 'bg-red-500/10 border border-red-500/20'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} className="text-green-400" />
          ) : (
            <AlertCircle size={20} className="text-red-400" />
          )}
          <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {message.text}
          </span>
        </div>
      )}

      <div className="flex justify-end">
        <BaseButton
          onClick={saveConfiguration}
          disabled={isSaving}
          className="dashboard-button-primary"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Save Configuration
            </>
          )}
        </BaseButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Configuration */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="dashboard-card-title flex items-center gap-2">
              <Mail size={20} />
              <span>Email Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="dashboard-label">Enable Email Service</Label>
                <p className="text-xs text-gray-500">Enable email notifications and templates</p>
              </div>
              <Switch
                checked={config.email_enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, email_enabled: checked }))}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label className="dashboard-label">Brevo API Key</Label>
                <div className="relative">
                  <BaseInput
                    type={showApiKey ? "text" : "password"}
                    value={config.brevo_api_key}
                    onChange={(e) => setConfig(prev => ({ ...prev, brevo_api_key: e.target.value }))}
                    placeholder="Enter your Brevo API key"
                    className="dashboard-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#C0C0C0] hover:text-white"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <Label className="dashboard-label">Sender Email</Label>
                <BaseInput
                  type="email"
                  value={config.sender_email}
                  onChange={(e) => setConfig(prev => ({ ...prev, sender_email: e.target.value }))}
                  placeholder="noreply@yourdomain.com"
                  className="dashboard-input"
                />
              </div>

              <div>
                <Label className="dashboard-label">Sender Name</Label>
                <BaseInput
                  value={config.sender_name}
                  onChange={(e) => setConfig(prev => ({ ...prev, sender_name: e.target.value }))}
                  placeholder="SoulPath Astrology"
                  className="dashboard-input"
                />
              </div>

              <div>
                <Label className="dashboard-label">Admin Email</Label>
                <BaseInput
                  type="email"
                  value={config.admin_email}
                  onChange={(e) => setConfig(prev => ({ ...prev, admin_email: e.target.value }))}
                  placeholder="admin@yourdomain.com"
                  className="dashboard-input"
                />
              </div>
            </div>

            {/* Test Email Section */}
            <div className="border-t border-[#C0C0C0]/20 pt-6">
              <h4 className="font-medium dashboard-text-primary mb-4">Test Email Configuration</h4>
              <div className="space-y-3">
                <BaseInput
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter test email address"
                  className="dashboard-input"
                />
                <BaseButton
                  onClick={testEmailConnection}
                  disabled={isTestingEmail || !testEmail || !config.email_enabled}
                  className="dashboard-button-success w-full"
                >
                  {isTestingEmail ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <TestTube size={16} className="mr-2" />
                      Send Test Email
                    </>
                  )}
                </BaseButton>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Configuration */}
        <Card className="bg-[#0A0A23]/30 border-[#C0C0C0]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#EAEAEA]">
              <Smartphone size={20} />
              <span>SMS Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[#C0C0C0]">Enable SMS Service</Label>
                <p className="text-xs text-gray-500">Enable SMS OTP verification and notifications</p>
              </div>
              <Switch
                checked={config.sms_enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, sms_enabled: checked }))}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-[#C0C0C0]">SMS Provider</Label>
                <Select value={config.sms_provider} onValueChange={(value) => setConfig(prev => ({ ...prev, sms_provider: value }))}>
                  <SelectTrigger className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="labsmobile">Labsmobile</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Currently only Labsmobile is supported</p>
              </div>

              <div>
                <Label className="text-[#C0C0C0]">Labsmobile Username</Label>
                <BaseInput
                  value={config.labsmobile_username}
                  onChange={(e) => setConfig(prev => ({ ...prev, labsmobile_username: e.target.value }))}
                  placeholder="Your Labsmobile username"
                  className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                />
              </div>

              <div>
                <Label className="text-[#C0C0C0]">Labsmobile API Token</Label>
                <div className="relative">
                  <BaseInput
                    type={showSmsToken ? "text" : "password"}
                    value={config.labsmobile_token}
                    onChange={(e) => setConfig(prev => ({ ...prev, labsmobile_token: e.target.value }))}
                    placeholder="Your Labsmobile API token"
                    className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmsToken(!showSmsToken)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#C0C0C0] hover:text-white"
                  >
                    {showSmsToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-[#C0C0C0]">SMS Sender Name</Label>
                <BaseInput
                  value={config.sms_sender_name}
                  onChange={(e) => setConfig(prev => ({ ...prev, sms_sender_name: e.target.value }))}
                  placeholder="SMS sender name (e.g., SoulPath)"
                  className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                />
              </div>
            </div>

            {/* Test SMS Section */}
            <div className="border-t border-[#C0C0C0]/20 pt-6">
              <h4 className="font-medium text-[#EAEAEA] mb-4">Test SMS Configuration</h4>
              <div className="space-y-3">
                <BaseInput
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                />
                <BaseInput
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Test SMS message"
                  className="bg-[#0A0A23]/50 border-[#C0C0C0]/30 text-[#EAEAEA]"
                />
                <BaseButton
                  onClick={testSmsConnection}
                  disabled={isTestingSms || !testPhone || !config.sms_enabled}
                  className="bg-[#10B981] hover:bg-[#059669] text-white px-4 w-full"
                >
                  {isTestingSms ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <TestTube size={16} className="mr-2" />
                      Send Test SMS
                    </>
                  )}
                </BaseButton>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
