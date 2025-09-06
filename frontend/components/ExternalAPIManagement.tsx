'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Database,
  Zap,
  MessageSquare,
  CreditCard,
  Globe,
  Shield,
  Clock
} from 'lucide-react';
import { BaseCard } from '@/components/ui/BaseCard';
import { BaseButton } from '@/components/ui/BaseButton';
import { useAuth } from '../hooks/useAuth';

interface ExternalAPIConfig {
  id?: string;
  name: string;
  provider: string;
  category: string;
  apiKey?: string;
  apiSecret?: string;
  apiUrl?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  config?: any;
  isActive: boolean;
  testMode: boolean;
  description?: string;
  version?: string;
  rateLimit?: number;
  timeout?: number;
  lastTestedAt?: string;
  lastTestResult?: string;
  healthStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

interface APIConfigFormData {
  name: string;
  provider: string;
  category: string;
  apiKey: string;
  apiSecret: string;
  apiUrl: string;
  webhookUrl: string;
  webhookSecret: string;
  config: string; // JSON string
  isActive: boolean;
  testMode: boolean;
  description: string;
  version: string;
  rateLimit: number;
  timeout: number;
}

const initialFormData: APIConfigFormData = {
  name: '',
  provider: '',
  category: 'ai',
  apiKey: '',
  apiSecret: '',
  apiUrl: '',
  webhookUrl: '',
  webhookSecret: '',
  config: '{}',
  isActive: false,
  testMode: true,
  description: '',
  version: '',
  rateLimit: 100,
  timeout: 30000,
};

const categoryIcons = {
  ai: Zap,
  communication: MessageSquare,
  payment: CreditCard,
  other: Globe,
};

const categoryColors = {
  ai: 'text-blue-400',
  communication: 'text-green-400',
  payment: 'text-purple-400',
  other: 'text-gray-400',
};

export function ExternalAPIManagement() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<ExternalAPIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ExternalAPIConfig | null>(null);
  const [formData, setFormData] = useState<APIConfigFormData>(initialFormData);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{[key: string]: any}>({});

  // Cargar configuraciones
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/admin/external-apis?action=list', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data || []);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let configData;
      try {
        configData = JSON.parse(formData.config);
      } catch {
        configData = {};
      }

      const payload = {
        ...formData,
        config: configData,
      };

      const url = editingConfig
        ? `/api/admin/external-apis?id=${editingConfig.id}`
        : '/api/admin/external-apis';

      const method = editingConfig ? 'PUT' : 'POST';
      const action = editingConfig ? undefined : 'create';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(action ? { action, data: payload } : payload),
      });

      if (response.ok) {
        await loadConfigs();
        setShowForm(false);
        setEditingConfig(null);
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleEdit = (config: ExternalAPIConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      provider: config.provider,
      category: config.category,
      apiKey: config.apiKey || '',
      apiSecret: config.apiSecret || '',
      apiUrl: config.apiUrl || '',
      webhookUrl: config.webhookUrl || '',
      webhookSecret: config.webhookSecret || '',
      config: JSON.stringify(config.config || {}, null, 2),
      isActive: config.isActive,
      testMode: config.testMode,
      description: config.description || '',
      version: config.version || '',
      rateLimit: config.rateLimit || 100,
      timeout: config.timeout || 30000,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/external-apis?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      });

      if (response.ok) {
        await loadConfigs();
      }
    } catch (error) {
      console.error('Error deleting config:', error);
    }
  };

  const handleTest = async (config: ExternalAPIConfig) => {
    if (!config.id) return;

    setTestingConfig(config.id);

    try {
      const response = await fetch('/api/admin/external-apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          action: 'test',
          data: { id: config.id },
        }),
      });

      const result = await response.json();
      setTestResults(prev => ({
        ...prev,
        [config.id as string]: result.data,
      }));
    } catch (error) {
      console.error('Error testing config:', error);
      setTestResults(prev => ({
        ...prev,
        [config.id as string]: { success: false, message: 'Test failed' },
      }));
    } finally {
      setTestingConfig(null);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // const copyToClipboard = (text: string) => {
  //   navigator.clipboard.writeText(text);
  // };

  const getHealthStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getHealthStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'unhealthy':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
        <span className="ml-2 text-gray-400">Cargando configuraciones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Configuración de APIs Externas</h2>
          <p className="text-gray-400">Gestiona las integraciones con servicios externos</p>
        </div>
        <BaseButton
          variant="primary"
          onClick={() => {
            setEditingConfig(null);
            setFormData(initialFormData);
            setShowForm(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nueva Configuración
        </BaseButton>
      </div>

      {/* Lista de Configuraciones */}
      <div className="grid gap-4">
        {configs.map((config) => {
          const CategoryIcon = categoryIcons[config.category as keyof typeof categoryIcons] || Globe;
          const testResult = testResults[config.id!];

          return (
            <BaseCard key={config.id} variant="default" size="lg">
              <BaseCard.Content>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg bg-gray-800 ${categoryColors[config.category as keyof typeof categoryColors] || 'text-gray-400'}`}>
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{config.provider}</h3>
                      <p className="text-gray-400">{config.name}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`text-sm px-2 py-1 rounded ${
                          config.isActive
                            ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                            : 'bg-red-900/20 text-red-400 border border-red-500/30'
                        }`}>
                          {config.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                        {config.testMode && (
                          <span className="text-sm px-2 py-1 rounded bg-yellow-900/20 text-yellow-400 border border-yellow-500/30">
                            Modo Test
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Health Status */}
                    <div className="flex items-center space-x-2">
                      {getHealthStatusIcon(config.healthStatus)}
                      <span className={`text-sm ${getHealthStatusColor(config.healthStatus)}`}>
                        {config.healthStatus || 'Desconocido'}
                      </span>
                    </div>

                    {/* Last Tested */}
                    {config.lastTestedAt && (
                      <div className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(config.lastTestedAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(config)}
                        loading={testingConfig === config.id}
                        leftIcon={<Play className="w-3 h-3" />}
                      >
                        Test
                      </BaseButton>

                      <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(config)}
                        leftIcon={<Edit className="w-3 h-3" />}
                      >
                        Editar
                      </BaseButton>

                      <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(config.id!)}
                        leftIcon={<Trash2 className="w-3 h-3" />}
                        className="text-red-400 hover:text-red-300"
                      >
                        Eliminar
                      </BaseButton>
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`mt-4 p-3 rounded-lg border ${
                      testResult.success
                        ? 'bg-green-900/20 border-green-500/30 text-green-400'
                        : 'bg-red-900/20 border-red-500/30 text-red-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span className="font-medium">Resultado del Test</span>
                    </div>
                    <p className="text-sm mt-1">{testResult.message}</p>
                    {testResult.details && (
                      <pre className="text-xs mt-2 bg-black/30 p-2 rounded overflow-x-auto">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    )}
                  </motion.div>
                )}

                {/* Description */}
                {config.description && (
                  <p className="text-gray-400 text-sm mt-3">{config.description}</p>
                )}
              </BaseCard.Content>
            </BaseCard>
          );
        })}

        {configs.length === 0 && (
          <BaseCard variant="default" size="lg">
            <BaseCard.Content>
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No hay configuraciones</h3>
                <p className="text-gray-400 mb-4">
                  Crea tu primera configuración de API externa para comenzar
                </p>
                <BaseButton
                  variant="primary"
                  onClick={() => setShowForm(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Crear Configuración
                </BaseButton>
              </div>
            </BaseCard.Content>
          </BaseCard>
        )}
      </div>

      {/* Modal de Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-xl font-bold text-white">
                  {editingConfig ? 'Editar Configuración' : 'Nueva Configuración'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Información Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="openrouter"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Proveedor *
                    </label>
                    <input
                      type="text"
                      value={formData.provider}
                      onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="OpenRouter"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Categoría *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="ai">Inteligencia Artificial</option>
                      <option value="communication">Comunicación</option>
                      <option value="payment">Pagos</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Versión
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="v1.0"
                    />
                  </div>
                </div>

                {/* Credenciales */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Credenciales
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.apiKey ? "text" : "password"}
                        value={formData.apiKey}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="sk-or-v1-xxxxxxxxxxxxx"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('apiKey')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPasswords.apiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      API Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.apiSecret ? "text" : "password"}
                        value={formData.apiSecret}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiSecret: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="secret-key"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('apiSecret')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPasswords.apiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* URLs y Configuración */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    URLs y Configuración
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      API URL
                    </label>
                    <input
                      type="url"
                      value={formData.apiUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://api.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://your-app.com/api/webhook"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Configuración JSON
                    </label>
                    <textarea
                      value={formData.config}
                      onChange={(e) => setFormData(prev => ({ ...prev, config: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                      rows={4}
                      placeholder='{"model": "gpt-3.5-turbo", "temperature": 0.7}'
                    />
                  </div>
                </div>

                {/* Configuración Avanzada */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Configuración Avanzada
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Rate Limit
                      </label>
                      <input
                        type="number"
                        value={formData.rateLimit}
                        onChange={(e) => setFormData(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        min="1"
                        max="10000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Timeout (ms)
                      </label>
                      <input
                        type="number"
                        value={formData.timeout}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        min="1000"
                        max="120000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      rows={2}
                      placeholder="Descripción del servicio..."
                    />
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Activo</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.testMode}
                        onChange={(e) => setFormData(prev => ({ ...prev, testMode: e.target.checked }))}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Modo Test</span>
                    </label>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                  <BaseButton
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </BaseButton>
                  <BaseButton
                    variant="primary"
                    type="submit"
                  >
                    {editingConfig ? 'Actualizar' : 'Crear'} Configuración
                  </BaseButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

