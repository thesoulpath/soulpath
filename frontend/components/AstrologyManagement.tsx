import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Download, 
  Share2, 
  RefreshCw, 
  BookOpen, 
  Calendar,
  MapPin,
  Clock,
  User,
  Eye,
  Save,
  Trash2
} from 'lucide-react';
import { AstrologyChartForm } from './AstrologyChartForm';
import { AstrologyChart } from './AstrologyChart';

interface ChartData {
  id: string;
  name: string;
  birthDate: Date;
  birthTime: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

export function AstrologyManagement() {
  const [currentChart, setCurrentChart] = useState<ChartData | null>(null);
  const [savedCharts, setSavedCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'saved' | 'interpretations'>('create');

  const handleFormSubmit = async (data: {
    name: string;
    birthDate: Date;
    birthTime: string;
    latitude: number;
    longitude: number;
  }) => {
    setLoading(true);
    
    // Simulate calculation time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newChart: ChartData = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date()
    };
    
    setCurrentChart(newChart);
    setSavedCharts(prev => [newChart, ...prev]);
    setShowForm(false);
    setLoading(false);
  };

  const handleSaveChart = () => {
    if (currentChart) {
      setSavedCharts(prev => {
        const existing = prev.find(chart => chart.id === currentChart.id);
        if (existing) {
          return prev.map(chart => 
            chart.id === currentChart.id ? currentChart : chart
          );
        }
        return [currentChart, ...prev];
      });
    }
  };

  const handleLoadChart = (chart: ChartData) => {
    setCurrentChart(chart);
    setShowForm(false);
  };

  const handleDeleteChart = (chartId: string) => {
    setSavedCharts(prev => prev.filter(chart => chart.id !== chartId));
    if (currentChart?.id === chartId) {
      setCurrentChart(null);
      setShowForm(true);
    }
  };

  const handleNewChart = () => {
    setCurrentChart(null);
    setShowForm(true);
    setActiveTab('create');
  };

  const handleDownloadChart = () => {
    if (!currentChart) return;
    
    // Create a simple text representation of the chart
    const chartText = `
ASTROLOGY CHART - ${currentChart.name}
Generated on: ${new Date().toLocaleDateString()}

BIRTH DATA:
Name: ${currentChart.name}
Date: ${currentChart.birthDate.toLocaleDateString()}
Time: ${currentChart.birthTime}
Location: ${currentChart.latitude}°, ${currentChart.longitude}°

---
This chart was generated using the ephemeris library.
    `.trim();

    const blob = new Blob([chartText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChart.name.replace(/\s+/g, '_')}_astrology_chart.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareChart = () => {
    if (!currentChart) return;
    
    const shareData = {
      title: `${currentChart.name}'s Astrology Chart`,
      text: `Check out ${currentChart.name}'s natal chart generated with our astrology system!`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.url);
      alert('Chart URL copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[var(--color-primary-500)] rounded-lg flex items-center justify-center">
            <Star size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Astrology Chart System
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Generate and manage natal charts using precise astronomical calculations
            </p>
          </div>
        </div>
        
        {currentChart && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadChart}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-background-secondary)] border border-[var(--color-border-500)] rounded-md hover:bg-[var(--color-border-300)] transition-colors"
            >
              <Download size={16} className="mr-2" />
              Download
            </button>
            <button
              onClick={handleShareChart}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-background-secondary)] border border-[var(--color-border-500)] rounded-md hover:bg-[var(--color-border-300)] transition-colors"
            >
              <Share2 size={16} className="mr-2" />
              Share
            </button>
            <button
              onClick={handleNewChart}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] border border-[var(--color-primary-500)] rounded-md hover:bg-[var(--color-primary-600)] transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              New Chart
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[var(--color-border-500)]">
        <nav className="flex space-x-8">
          {[
            { key: 'create', label: 'Create Chart', icon: Star },
            { key: 'saved', label: 'Saved Charts', icon: BookOpen },
            { key: 'interpretations', label: 'Interpretations', icon: Eye }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'create' | 'saved' | 'interpretations')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === key
                  ? 'border-[var(--color-primary-500)] text-[var(--color-primary-500)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-500)]'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'create' && (
            <div className="space-y-6">
              {showForm ? (
                <AstrologyChartForm onSubmit={handleFormSubmit} loading={loading} />
              ) : currentChart ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                      {currentChart.name}&apos;s Natal Chart
                    </h2>
                    <button
                      onClick={handleSaveChart}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] border border-[var(--color-primary-500)] rounded-md hover:bg-[var(--color-primary-600)] transition-colors"
                    >
                      <Save size={16} className="mr-2" />
                      Save Chart
                    </button>
                  </div>
                  
                  <AstrologyChart
                    dateTime={new Date(currentChart.birthDate.getTime() + new Date(`1970-01-01T${currentChart.birthTime}`).getTime())}
                    latitude={currentChart.latitude}
                    longitude={currentChart.longitude}
                    name={currentChart.name}
                  />
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  Saved Charts
                </h2>
                <button
                  onClick={handleNewChart}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] border border-[var(--color-primary-500)] rounded-md hover:bg-[var(--color-primary-600)] transition-colors"
                >
                  <Star size={16} className="mr-2" />
                  Create New
                </button>
              </div>

              {savedCharts.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen size={48} className="mx-auto mb-4 text-[var(--color-text-secondary)]" />
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                    No saved charts yet
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-4">
                    Create your first astrology chart to get started
                  </p>
                  <button
                    onClick={handleNewChart}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-500)] border border-[var(--color-primary-500)] rounded-md hover:bg-[var(--color-primary-600)] transition-colors"
                  >
                    <Star size={16} className="mr-2" />
                    Create Chart
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedCharts.map((chart) => (
                    <div
                      key={chart.id}
                      className="bg-[var(--color-background-secondary)] border border-[var(--color-border-500)] rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-[var(--color-primary-500)] rounded-full flex items-center justify-center">
                            <User size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-[var(--color-text-primary)]">
                              {chart.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-[var(--color-text-secondary)]">
                              <span className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                {chart.birthDate.toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock size={14} className="mr-1" />
                                {chart.birthTime}
                              </span>
                              <span className="flex items-center">
                                <MapPin size={14} className="mr-1" />
                                {chart.latitude.toFixed(2)}°, {chart.longitude.toFixed(2)}°
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleLoadChart(chart)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-background-primary)] border border-[var(--color-border-500)] rounded-md hover:bg-[var(--color-border-300)] transition-colors"
                          >
                            <Eye size={16} className="mr-2" />
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteChart(chart.id)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'interpretations' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Astrology Interpretations
              </h2>
              
              <div className="grid gap-6">
                <div className="bg-[var(--color-background-secondary)] border border-[var(--color-border-500)] rounded-lg p-6">
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
                    Understanding Your Chart
                  </h3>
                  <div className="prose prose-sm text-[var(--color-text-secondary)]">
                    <p className="mb-4">
                      Your natal chart is a snapshot of the sky at the exact moment of your birth. 
                      It reveals your unique cosmic blueprint and can provide insights into your personality, 
                      strengths, challenges, and life path.
                    </p>
                    <p className="mb-4">
                      The chart shows the positions of the Sun, Moon, and planets in the zodiac signs 
                      and houses at your birth time and location. Each element has specific meanings 
                      and influences that shape your character and experiences.
                    </p>
                    <p>
                      <strong>Key Elements:</strong>
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>Sun Sign:</strong> Your core identity and ego</li>
                      <li><strong>Moon Sign:</strong> Your emotional nature and inner self</li>
                      <li><strong>Rising Sign (Ascendant):</strong> How you appear to others</li>
                      <li><strong>Planets:</strong> Different aspects of your personality</li>
                      <li><strong>Houses:</strong> Areas of life where these energies manifest</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-[var(--color-background-secondary)] border border-[var(--color-border-500)] rounded-lg p-6">
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
                    How to Read Your Chart
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <h4 className="font-medium text-[var(--color-text-primary)] mb-2">The Chart Circle</h4>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        The outer circle represents the zodiac, divided into 12 signs of 30° each. 
                        The inner circle shows the 12 houses. Planets are placed according to their 
                        positions at your birth time.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--color-text-primary)] mb-2">Planetary Symbols</h4>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Each planet has its own symbol and color. Retrograde planets (marked with &quot;R&quot;)
                        move backward in the sky and have special significance in interpretation.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--color-text-primary)] mb-2">Angles</h4>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        The Ascendant (AS) and Midheaven (MC) are key points that show your rising sign 
                        and career/public image respectively.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
