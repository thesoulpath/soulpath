import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Calendar, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { AstrologyChartForm } from './AstrologyChartForm';
import { AstrologyChart } from './AstrologyChart';

interface AstrologySectionProps {
  className?: string;
}

export function AstrologySection({ className = '' }: AstrologySectionProps) {
  const [currentChart, setCurrentChart] = useState<{
    name: string;
    birthDate: Date;
    birthTime: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);

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
    
    setCurrentChart(data);
    setShowForm(false);
    setLoading(false);
  };

  const handleNewChart = () => {
    setCurrentChart(null);
    setShowForm(true);
  };

  return (
    <section className={`py-16 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={40} className="text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Discover Your Cosmic Blueprint
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Generate your personalized natal chart using precise astronomical calculations. 
              Unlock insights into your personality, strengths, and life path through the ancient wisdom of astrology.
            </p>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Precise Calculations</h3>
            <p className="text-purple-200">
              Uses NASA&apos;s ephemeris data for accurate planetary positions at your exact birth moment
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Complete Chart</h3>
            <p className="text-purple-200">
              Full natal chart with all planets, houses, and aspects for comprehensive analysis
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Location Based</h3>
            <p className="text-purple-200">
              Accurate calculations based on your exact birth location and time
            </p>
          </div>
        </motion.div>

        {/* Chart Generation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Generate Your Natal Chart
                    </h3>
                    <p className="text-purple-200">
                      Enter your birth details to create your personalized astrology chart
                    </p>
                  </div>
                  
                  <AstrologyChartForm 
                    onSubmit={handleFormSubmit} 
                    loading={loading} 
                  />
                </motion.div>
              ) : currentChart ? (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {currentChart.name}&apos;s Natal Chart
                    </h3>
                    <p className="text-purple-200 mb-4">
                      Your cosmic blueprint revealed through the positions of the planets at your birth
                    </p>
                    <button
                      onClick={handleNewChart}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 border border-purple-500 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                    >
                      <ArrowRight size={16} className="mr-2" />
                      Create Another Chart
                    </button>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                    <AstrologyChart
                      dateTime={new Date(currentChart.birthDate.getTime() + new Date(`1970-01-01T${currentChart.birthTime}`).getTime())}
                      latitude={currentChart.latitude}
                      longitude={currentChart.longitude}
                      name={currentChart.name}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Understanding Your Natal Chart
            </h3>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">What Your Chart Reveals</h4>
                <ul className="space-y-2 text-purple-200">
                  <li className="flex items-start">
                    <Star size={16} className="text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                    <span>Your core personality and life purpose (Sun Sign)</span>
                  </li>
                  <li className="flex items-start">
                    <Star size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                    <span>Your emotional nature and inner world (Moon Sign)</span>
                  </li>
                  <li className="flex items-start">
                    <Star size={16} className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                    <span>How you appear to others (Rising Sign)</span>
                  </li>
                  <li className="flex items-start">
                    <Star size={16} className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                    <span>Your communication style and thinking patterns</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">How to Use Your Chart</h4>
                <ul className="space-y-2 text-purple-200">
                  <li className="flex items-start">
                    <ArrowRight size={16} className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                    <span>Study your planetary positions and aspects</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight size={16} className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                    <span>Explore the meanings of your zodiac signs</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight size={16} className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                    <span>Understand your house placements</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight size={16} className="text-purple-400 mr-2 mt-1 flex-shrink-0" />
                    <span>Consider consulting with a professional astrologer</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
