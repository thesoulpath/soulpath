import React, { useState, useEffect } from 'react';
import {
  Settings,
  Play,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Brain,
  Target,
  BarChart3,
  Save,
  RotateCcw
} from 'lucide-react';

interface ModelConfig {
  pipeline: Array<{
    name: string;
    [key: string]: any;
  }>;
  policies: Array<{
    name: string;
    [key: string]: any;
  }>;
  language: string;
  assistant_id: string;
}

interface TrainingProgress {
  status: 'idle' | 'training' | 'completed' | 'error';
  progress: number;
  message: string;
  modelVersion?: string;
  error?: string;
}

interface ModelComparison {
  modelName: string;
  accuracy: number;
  processingTime: number;
  confidence: number;
  timestamp: string;
}

export function RasaModelTuning() {
  const [activeTab, setActiveTab] = useState('config');
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress>({
    status: 'idle',
    progress: 0,
    message: 'Ready to train'
  });
  const [modelComparisons, setModelComparisons] = useState<ModelComparison[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [configText, setConfigText] = useState('');

  const tabs = [
    { id: 'config', label: 'Model Configuration', icon: Settings },
    { id: 'training', label: 'Training', icon: Play },
    { id: 'comparison', label: 'Model Comparison', icon: BarChart3 },
    { id: 'evaluation', label: 'Evaluation', icon: Target }
  ];

  const predefinedConfigs = {
    'high-precision': {
      name: 'High Precision',
      description: 'Maximum accuracy, slower processing',
      config: {
        pipeline: [
          { name: 'WhitespaceTokenizer' },
          { name: 'RegexFeaturizer', case_sensitive: false },
          { name: 'LexicalSyntacticFeaturizer' },
          { name: 'CountVectorsFeaturizer', analyzer: 'char_wb', min_ngram: 1, max_ngram: 5 },
          { name: 'DIETClassifier', epochs: 200, entity_recognition: true, intent_classification: true, use_masked_language_model: true, constrain_similarities: true, model_confidence: 'softmax', random_seed: 42 },
          { name: 'EntitySynonymMapper' },
          { name: 'ResponseSelector', epochs: 200, constrain_similarities: true, retrieval_intent: 'chitchat/ask_name', use_gpu: false }
        ],
        policies: [
          { name: 'MemoizationPolicy', max_history: 5 },
          { name: 'RulePolicy' },
          { name: 'UnexpecTEDIntentPolicy', max_history: 5, epochs: 100, use_gpu: false },
          { name: 'TEDPolicy', max_history: 5, epochs: 100, constrain_similarities: true, use_gpu: false, model_confidence: 'softmax', random_seed: 42 }
        ],
        language: 'es',
        assistant_id: 'soulpath-rasa'
      }
    },
    'balanced': {
      name: 'Balanced',
      description: 'Good balance of speed and accuracy',
      config: {
        pipeline: [
          { name: 'WhitespaceTokenizer' },
          { name: 'RegexFeaturizer', case_sensitive: false },
          { name: 'LexicalSyntacticFeaturizer' },
          { name: 'CountVectorsFeaturizer', analyzer: 'char_wb', min_ngram: 1, max_ngram: 3 },
          { name: 'DIETClassifier', epochs: 50, entity_recognition: true, intent_classification: true, use_masked_language_model: false, constrain_similarities: true, model_confidence: 'softmax', random_seed: 42 },
          { name: 'EntitySynonymMapper' },
          { name: 'ResponseSelector', epochs: 50, constrain_similarities: true, retrieval_intent: 'chitchat/ask_name', use_gpu: false }
        ],
        policies: [
          { name: 'MemoizationPolicy', max_history: 3 },
          { name: 'RulePolicy' },
          { name: 'UnexpecTEDIntentPolicy', max_history: 3, epochs: 50, use_gpu: false },
          { name: 'TEDPolicy', max_history: 3, epochs: 50, constrain_similarities: true, use_gpu: false, model_confidence: 'softmax', random_seed: 42 }
        ],
        language: 'es',
        assistant_id: 'soulpath-rasa'
      }
    },
    'high-speed': {
      name: 'High Speed',
      description: 'Fast processing, lower accuracy',
      config: {
        pipeline: [
          { name: 'WhitespaceTokenizer' },
          { name: 'RegexFeaturizer', case_sensitive: false },
          { name: 'CountVectorsFeaturizer', analyzer: 'char_wb', min_ngram: 1, max_ngram: 2 },
          { name: 'DIETClassifier', epochs: 20, entity_recognition: true, intent_classification: true, use_masked_language_model: false, constrain_similarities: false, model_confidence: 'softmax', random_seed: 42 }
        ],
        policies: [
          { name: 'MemoizationPolicy', max_history: 2 },
          { name: 'RulePolicy' },
          { name: 'UnexpecTEDIntentPolicy', max_history: 2, epochs: 20, use_gpu: false },
          { name: 'TEDPolicy', max_history: 2, epochs: 20, constrain_similarities: false, use_gpu: false, model_confidence: 'softmax', random_seed: 42 }
        ],
        language: 'es',
        assistant_id: 'soulpath-rasa'
      }
    }
  };

  useEffect(() => {
    loadCurrentConfig();
    loadModelComparisons();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/admin/rasa?action=model-info');
      const data = await response.json();
      if (data.success && data.data.currentModel) {
        // This would need to be implemented to fetch actual config
        setConfig(predefinedConfigs.balanced.config);
        setConfigText(JSON.stringify(predefinedConfigs.balanced.config, null, 2));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadModelComparisons = async () => {
    // Mock data for demonstration
    setModelComparisons([
      {
        modelName: 'nlu-20250906-160155-amicable-rasp',
        accuracy: 94.2,
        processingTime: 245,
        confidence: 0.87,
        timestamp: '2025-01-06T16:01:55Z'
      },
      {
        modelName: 'nlu-20250905-120000-previous-model',
        accuracy: 91.8,
        processingTime: 198,
        confidence: 0.84,
        timestamp: '2025-01-05T12:00:00Z'
      }
    ]);
  };

  const startTraining = async () => {
    setTrainingProgress({
      status: 'training',
      progress: 0,
      message: 'Starting training...'
    });

    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev.progress >= 100) {
          clearInterval(interval);
          return {
            status: 'completed',
            progress: 100,
            message: 'Training completed successfully!',
            modelVersion: `nlu-${Date.now()}-trained-model`
          };
        }
        return {
          ...prev,
          progress: prev.progress + Math.random() * 10,
          message: `Training in progress... ${Math.round(prev.progress)}%`
        };
      });
    }, 1000);
  };

  const applyPredefinedConfig = (configKey: keyof typeof predefinedConfigs) => {
    const predefinedConfig = predefinedConfigs[configKey];
    setConfig(predefinedConfig.config);
    setConfigText(JSON.stringify(predefinedConfig.config, null, 2));
    setIsEditing(false);
  };

  const saveConfig = () => {
    try {
      const parsedConfig = JSON.parse(configText);
      setConfig(parsedConfig);
      setIsEditing(false);
      // Here you would save to the server
    } catch (error) {
      alert('Invalid JSON configuration');
    }
  };

  const resetConfig = () => {
    if (config) {
      setConfigText(JSON.stringify(config, null, 2));
      setIsEditing(false);
    }
  };

  const runEvaluation = async () => {
    // Mock evaluation
    alert('Evaluation started. This would run actual Rasa evaluation commands.');
  };

  const downloadModel = (modelName: string) => {
    // Mock download
    alert(`Downloading model: ${modelName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Rasa Model Tuning
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              Configure, train, and optimize your AI models
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-[var(--color-background-secondary)] p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-[var(--color-background-primary)] rounded-lg border border-[var(--color-border-500)] p-6">
        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Model Configuration
              </h3>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={saveConfig}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={resetConfig}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Predefined Configurations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(predefinedConfigs).map(([key, config]) => (
                <div key={key} className="border border-[var(--color-border-500)] rounded-lg p-4">
                  <h4 className="font-semibold text-[var(--color-text-primary)] mb-2">
                    {config.name}
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    {config.description}
                  </p>
                  <button
                    onClick={() => applyPredefinedConfig(key as keyof typeof predefinedConfigs)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Apply Configuration
                  </button>
                </div>
              ))}
            </div>

            {/* Configuration Editor */}
            <div className="space-y-4">
              <h4 className="font-semibold text-[var(--color-text-primary)]">
                Current Configuration
              </h4>
              {isEditing ? (
                <textarea
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  className="w-full h-96 p-4 border border-[var(--color-border-500)] rounded-lg bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] font-mono text-sm"
                  placeholder="Enter your configuration JSON..."
                />
              ) : (
                <pre className="w-full h-96 p-4 border border-[var(--color-border-500)] rounded-lg bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] font-mono text-sm overflow-auto">
                  {JSON.stringify(config, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Model Training
            </h3>

            {/* Training Status */}
            <div className="bg-[var(--color-background-secondary)] p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-[var(--color-text-primary)]">
                  Training Status
                </h4>
                <div className="flex items-center space-x-2">
                  {trainingProgress.status === 'training' && (
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                  )}
                  {trainingProgress.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {trainingProgress.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)]">Progress</span>
                  <span className="text-[var(--color-text-primary)] font-semibold">
                    {Math.round(trainingProgress.progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${trainingProgress.progress}%` }}
                  ></div>
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  {trainingProgress.message}
                </p>
                {trainingProgress.modelVersion && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Model: {trainingProgress.modelVersion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Training Controls */}
            <div className="flex space-x-4">
              <button
                onClick={startTraining}
                disabled={trainingProgress.status === 'training'}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>Start Training</span>
              </button>
              <button
                onClick={runEvaluation}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Target className="w-4 h-4" />
                <span>Run Evaluation</span>
              </button>
            </div>
          </div>
        )}

        {/* Model Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Model Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border-500)]">
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Model</th>
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Accuracy</th>
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Processing Time</th>
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Confidence</th>
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Created</th>
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {modelComparisons.map((model, index) => (
                    <tr key={index} className="border-b border-[var(--color-border-300)]">
                      <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium">
                        {model.modelName}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-primary)]">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${model.accuracy}%` }}
                            ></div>
                          </div>
                          <span>{model.accuracy}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                        {model.processingTime}ms
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                        {(model.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                        {new Date(model.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => downloadModel(model.modelName)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Evaluation Tab */}
        {activeTab === 'evaluation' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Model Evaluation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[var(--color-background-secondary)] p-6 rounded-lg">
                <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">
                  NLU Evaluation
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Intent Accuracy:</span>
                    <span className="text-[var(--color-text-primary)]">94.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Entity F1-Score:</span>
                    <span className="text-[var(--color-text-primary)]">91.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Response Time:</span>
                    <span className="text-[var(--color-text-primary)]">245ms</span>
                  </div>
                </div>
                <button
                  onClick={runEvaluation}
                  className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Run NLU Evaluation
                </button>
              </div>

              <div className="bg-[var(--color-background-secondary)] p-6 rounded-lg">
                <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">
                  Core Evaluation
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Story Accuracy:</span>
                    <span className="text-[var(--color-text-primary)]">89.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Action Accuracy:</span>
                    <span className="text-[var(--color-text-primary)]">92.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Fallback Rate:</span>
                    <span className="text-[var(--color-text-primary)]">3.2%</span>
                  </div>
                </div>
                <button
                  onClick={runEvaluation}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Run Core Evaluation
                </button>
              </div>
            </div>

            <div className="bg-[var(--color-background-secondary)] p-6 rounded-lg">
              <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">
                Cross-Validation Results
              </h4>
              <div className="text-[var(--color-text-secondary)] text-sm">
                <p>Cross-validation provides a more robust evaluation by testing the model on multiple data splits.</p>
                <div className="mt-4 flex space-x-4">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Run 5-Fold CV
                  </button>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    Run 10-Fold CV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
