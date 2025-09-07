'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Bot, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Webhook,
  Key,
  Save,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface TelegramConfig {
  id?: string;
  bot_token: string;
  webhook_url: string;
  is_active: boolean;
  bot_username: string;
  bot_name: string;
  webhook_set: boolean;
  last_webhook_error: string | null;
  created_at?: string;
  updated_at?: string;
}

interface BotInfo {
  id: number;
  first_name: string;
  username?: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

export function TelegramConfigManagement() {
  const { user } = useAuth();
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [showToken, setShowToken] = useState(false);

  const [formData, setFormData] = useState({
    bot_token: '',
    webhook_url: '',
    is_active: false
  });

  // Load configuration
  useEffect(() => {
    if (user?.access_token) {
      loadConfig();
    }
  }, [user?.access_token]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/telegram-config', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setConfig(result.config);
        setFormData({
          bot_token: result.config.bot_token || '',
          webhook_url: result.config.webhook_url || '',
          is_active: result.config.is_active || false
        });
      } else {
        toast.error('Failed to load Telegram configuration');
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    if (!formData.bot_token) {
      toast.error('Please enter a bot token first');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/admin/telegram-config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_token: formData.bot_token,
          webhook_url: formData.webhook_url,
          is_active: false // Don't activate during test
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setBotInfo(result.botInfo);
        toast.success('Bot connection test successful!');
      } else {
        toast.error(result.details || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/telegram-config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        setConfig(result.config);
        toast.success('Telegram configuration saved successfully!');
        await loadConfig(); // Reload to get updated info
      } else {
        toast.error(result.details || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the Telegram configuration? This will also remove the webhook.')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/telegram-config', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setConfig(null);
        setFormData({
          bot_token: '',
          webhook_url: '',
          is_active: false
        });
        setBotInfo(null);
        toast.success('Telegram configuration deleted successfully!');
      } else {
        toast.error(result.details || 'Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Failed to delete configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading Telegram configuration...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Telegram Bot Configuration</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Configure your Telegram bot integration for conversational AI
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Bot Token */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Key className="h-4 w-4" />
              <span>Bot Token</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={formData.bot_token}
                onChange={(e) => handleInputChange('bot_token', e.target.value)}
                placeholder="Enter your Telegram bot token (e.g., 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Get your bot token from @BotFather on Telegram
            </p>
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Webhook className="h-4 w-4" />
              <span>Webhook URL</span>
            </label>
            <input
              type="url"
              value={formData.webhook_url}
              onChange={(e) => handleInputChange('webhook_url', e.target.value)}
              placeholder="https://your-domain.vercel.app/api/telegram/webhook"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500">
              The webhook URL where Telegram will send messages
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Activate Telegram bot
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              onClick={testConnection}
              disabled={testing || !formData.bot_token}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube className="h-4 w-4" />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !formData.bot_token}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>

            {config && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bot Information */}
      {botInfo && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Bot Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Bot Name</label>
                <p className="text-sm text-gray-900">{botInfo.first_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Username</label>
                <p className="text-sm text-gray-900">@{botInfo.username || 'No username'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Bot ID</label>
                <p className="text-sm text-gray-900">{botInfo.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Can Join Groups</label>
                <p className="text-sm text-gray-900">{botInfo.can_join_groups ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Status */}
      {config && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Configuration Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {config.is_active ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-700">Bot Active</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  config.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {config.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {config.webhook_set ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm font-medium text-gray-700">Webhook Set</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  config.webhook_set 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {config.webhook_set ? 'Set' : 'Not Set'}
                </span>
              </div>

              {config.last_webhook_error && (
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Last Webhook Error</span>
                    <p className="text-xs text-red-600 mt-1">{config.last_webhook_error}</p>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                <p>Last updated: {config.updated_at ? new Date(config.updated_at).toLocaleString() : 'Never'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Setup Instructions</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="font-medium">1.</span>
            <span>Create a bot with @BotFather on Telegram and get your bot token</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">2.</span>
            <span>Enter your bot token in the field above</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">3.</span>
            <span>Set your webhook URL (usually your domain + /api/telegram/webhook)</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">4.</span>
            <span>Test the connection to verify your bot token is valid</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">5.</span>
            <span>Save the configuration to activate the bot</span>
          </div>
        </div>
      </div>
    </div>
  );
}
