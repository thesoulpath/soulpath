import React, { useState } from 'react';
// import { motion } from 'framer-motion'; // Unused for now
import { Calendar, MapPin, Clock, User, Star } from 'lucide-react';

interface AstrologyChartFormProps {
  onSubmit: (data: {
    name: string;
    birthDate: Date;
    birthTime: string;
    latitude: number;
    longitude: number;
  }) => void;
  loading?: boolean;
}

export function AstrologyChartForm({ onSubmit, loading = false }: AstrologyChartFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '12:00',
    latitude: '',
    longitude: '',
    city: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Common city coordinates
  const commonCities = [
    { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
    { name: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333 },
    { name: 'Moscow, Russia', lat: 55.7558, lng: 37.6176 },
    { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
    { name: 'Lima, Peru', lat: -12.0464, lng: -77.0428 }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCitySelect = (city: typeof commonCities[0]) => {
    setFormData(prev => ({
      ...prev,
      city: city.name,
      latitude: city.lat.toString(),
      longitude: city.lng.toString()
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    } else {
      const selectedDate = new Date(formData.birthDate);
      const now = new Date();
      if (selectedDate > now) {
        newErrors.birthDate = 'Birth date cannot be in the future';
      }
    }

    if (!formData.birthTime) {
      newErrors.birthTime = 'Birth time is required';
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.latitude = 'Location coordinates are required';
    } else {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90';
      }
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      birthDate: new Date(formData.birthDate),
      birthTime: formData.birthTime,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude)
    };

    onSubmit(submitData);
  };

  return (
    <div
      className="bg-black/20 rounded-lg border border-white/20 p-6 text-white"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Create Your Astrology Chart
        </h2>
        <p className="text-white/70">
          Enter your birth details to generate your natal chart
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <User size={16} className="inline mr-2" />
            Full Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/50 ${
              errors.name 
                ? 'border-red-500 bg-red-500/10' 
                : 'border-white/30 bg-white/10'
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <Calendar size={16} className="inline mr-2" />
            Birth Date
          </label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleInputChange('birthDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
              errors.birthDate 
                ? 'border-red-500 bg-red-500/10' 
                : 'border-white/30 bg-white/10'
            }`}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.birthDate && (
            <p className="text-red-400 text-sm mt-1">{errors.birthDate}</p>
          )}
        </div>

        {/* Birth Time */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <Clock size={16} className="inline mr-2" />
            Birth Time
          </label>
          <input
            type="time"
            value={formData.birthTime}
            onChange={(e) => handleInputChange('birthTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
              errors.birthTime 
                ? 'border-red-500 bg-red-500/10' 
                : 'border-white/30 bg-white/10'
            }`}
          />
          {errors.birthTime && (
            <p className="text-red-400 text-sm mt-1">{errors.birthTime}</p>
          )}
          <p className="text-xs text-white/70 mt-1">
            If you don&apos;t know your exact birth time, use 12:00 PM as a default
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <MapPin size={16} className="inline mr-2" />
            Birth Location
          </label>
          
          {/* Common Cities */}
          <div className="mb-4">
            <p className="text-sm text-white/70 mb-2">
              Quick select from common cities:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {commonCities.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    formData.city === city.name
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white placeholder-white/50 ${
                  errors.latitude 
                    ? 'border-red-500 bg-red-500/10' 
                    : 'border-white/30 bg-white/10'
                }`}
                placeholder="e.g., 40.7128"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white placeholder-white/50 ${
                  errors.longitude 
                    ? 'border-red-500 bg-red-500/10' 
                    : 'border-white/30 bg-white/10'
                }`}
                placeholder="e.g., -74.0060"
              />
            </div>
          </div>
          {(errors.latitude || errors.longitude) && (
            <p className="text-red-400 text-sm mt-1">{errors.latitude || errors.longitude}</p>
          )}
          <p className="text-xs text-white/70 mt-1">
            You can find coordinates using Google Maps or other mapping services
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Calculating Chart...
            </div>
          ) : (
            'Generate Natal Chart'
          )}
        </button>
      </form>
    </div>
  );
}
