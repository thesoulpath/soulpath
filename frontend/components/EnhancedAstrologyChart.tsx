'use client';

import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion'; // Unused for now
import { Star, Zap, Target, Compass } from 'lucide-react';
import { useHoroscope } from '../lib/horoscope-client';

interface EnhancedAstrologyChartProps {
  birthDate: Date;
  birthTime: string;
  latitude: number;
  longitude: number;
  name?: string;
}

interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  sign: string;
  degree: number;
  minute: number;
  isRetrograde?: boolean;
  element: string;
  quality: string;
  ruler: string;
}

interface ChartData {
  planets: PlanetPosition[];
  houses: number[];
  ascendant: number;
  midheaven: number;
  sunSign: string;
  moonSign: string;
  risingSign: string;
  aspects: Aspect[];
  elementBalance: { [key: string]: number };
  qualityBalance: { [key: string]: number };
}

interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  orbString: string;
}

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const PLANET_SYMBOLS: { [key: string]: string } = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
  chiron: '⚷'
};

const ZODIAC_DATA = {
  Aries: { element: 'Fire', quality: 'Cardinal', ruler: 'Mars' },
  Taurus: { element: 'Earth', quality: 'Fixed', ruler: 'Venus' },
  Gemini: { element: 'Air', quality: 'Mutable', ruler: 'Mercury' },
  Cancer: { element: 'Water', quality: 'Cardinal', ruler: 'Moon' },
  Leo: { element: 'Fire', quality: 'Fixed', ruler: 'Sun' },
  Virgo: { element: 'Earth', quality: 'Mutable', ruler: 'Mercury' },
  Libra: { element: 'Air', quality: 'Cardinal', ruler: 'Venus' },
  Scorpio: { element: 'Water', quality: 'Fixed', ruler: 'Pluto' },
  Sagittarius: { element: 'Fire', quality: 'Mutable', ruler: 'Jupiter' },
  Capricorn: { element: 'Earth', quality: 'Cardinal', ruler: 'Saturn' },
  Aquarius: { element: 'Air', quality: 'Fixed', ruler: 'Uranus' },
  Pisces: { element: 'Water', quality: 'Mutable', ruler: 'Neptune' }
};

const PLANET_COLORS: { [key: string]: string } = {
  sun: '#FFD700',
  moon: '#C0C0C0',
  mercury: '#87CEEB',
  venus: '#FFB6C1',
  mars: '#FF6347',
  jupiter: '#FFA500',
  saturn: '#F4A460',
  uranus: '#40E0D0',
  neptune: '#4169E1',
  pluto: '#8B008B',
  chiron: '#9370DB'
};

export function EnhancedAstrologyChart({ 
  birthDate, 
  birthTime, 
  latitude, 
  longitude, 
  name = 'Enhanced Natal Chart' 
}: EnhancedAstrologyChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAspects, setShowAspects] = useState(true);
  const { Ephemeris, isLoading, error: horoscopeError } = useHoroscope();

  useEffect(() => {
    const generateChart = async () => {
      if (isLoading) return;
      
      if (horoscopeError) {
        setError(`Circular Natal Horoscope error: ${horoscopeError}`);
        setLoading(false);
        return;
      }

              if (!Ephemeris) {
          setError('Ephemeris not available');
          setLoading(false);
          return;
        }

      try {
        setLoading(true);
        const dateTime = new Date(birthDate);
        const [hours, minutes] = birthTime.split(':').map(Number);
        dateTime.setHours(hours, minutes, 0, 0);

        // Get planetary positions using ephemeris
        const ephemerisData = Ephemeris.getAllPlanets(dateTime, latitude, longitude);
        
        const planets: PlanetPosition[] = [];
        const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'];

        for (const planetName of planetNames) {
          try {
            const planetData = ephemerisData.observed[planetName];
            if (planetData) {
              const longitude = planetData.apparentLongitudeDd;
              const latitude = 0; // Ephemeris doesn't provide latitude
              
              const signIndex = Math.floor(longitude / 30);
              const degree = Math.floor(longitude % 30);
              const minute = Math.floor((longitude % 30 - degree) * 60);
              const sign = ZODIAC_SIGNS[signIndex];
              const signData = ZODIAC_DATA[sign as keyof typeof ZODIAC_DATA];

              planets.push({
                name: planetName,
                longitude: longitude,
                latitude: latitude,
                sign: sign,
                degree,
                minute,
                isRetrograde: planetData.is_retrograde || false,
                element: signData.element,
                quality: signData.quality,
                ruler: signData.ruler
              });
            }
          } catch (err) {
            console.warn(`Failed to calculate position for ${planetName}:`, err);
          }
        }

        // Calculate aspects (simplified)
        const aspects: Aspect[] = [];
        
        // Calculate major aspects between planets
        for (let i = 0; i < planets.length; i++) {
          for (let j = i + 1; j < planets.length; j++) {
            const planet1 = planets[i];
            const planet2 = planets[j];
            const angle = Math.abs(planet1.longitude - planet2.longitude);
            const orb = Math.min(angle, 360 - angle);
            
            // Major aspects
            if (Math.abs(orb - 0) <= 8) { // Conjunction
              aspects.push({
                planet1: planet1.name,
                planet2: planet2.name,
                type: 'Conjunction',
                orb: orb,
                orbString: `${orb.toFixed(1)}°`
              });
            } else if (Math.abs(orb - 60) <= 6) { // Sextile
              aspects.push({
                planet1: planet1.name,
                planet2: planet2.name,
                type: 'Sextile',
                orb: Math.abs(orb - 60),
                orbString: `${Math.abs(orb - 60).toFixed(1)}°`
              });
            } else if (Math.abs(orb - 90) <= 7) { // Square
              aspects.push({
                planet1: planet1.name,
                planet2: planet2.name,
                type: 'Square',
                orb: Math.abs(orb - 90),
                orbString: `${Math.abs(orb - 90).toFixed(1)}°`
              });
            } else if (Math.abs(orb - 120) <= 8) { // Trine
              aspects.push({
                planet1: planet1.name,
                planet2: planet2.name,
                type: 'Trine',
                orb: Math.abs(orb - 120),
                orbString: `${Math.abs(orb - 120).toFixed(1)}°`
              });
            } else if (Math.abs(orb - 180) <= 8) { // Opposition
              aspects.push({
                planet1: planet1.name,
                planet2: planet2.name,
                type: 'Opposition',
                orb: Math.abs(orb - 180),
                orbString: `${Math.abs(orb - 180).toFixed(1)}°`
              });
            }
          }
        }

        // Calculate element and quality balance
        const elementBalance: { [key: string]: number } = {};
        const qualityBalance: { [key: string]: number } = {};
        
        planets.forEach(planet => {
          elementBalance[planet.element] = (elementBalance[planet.element] || 0) + 1;
          qualityBalance[planet.quality] = (qualityBalance[planet.quality] || 0) + 1;
        });

        // Calculate houses (simplified - using equal house system)
        const houses = [];
        const ascendant = 0; // Simplified for now
        
        for (let i = 0; i < 12; i++) {
          const houseLongitude = (ascendant + (i * 30)) % 360;
          houses.push(houseLongitude);
        }
        
        const midheaven = 0; // Simplified for now

        // Determine signs
        const sunSign = planets.find(p => p.name === 'sun')?.sign || '';
        const moonSign = planets.find(p => p.name === 'moon')?.sign || '';
        const risingSign = ZODIAC_SIGNS[Math.floor(ascendant / 30)];

        setChartData({
          planets,
          houses,
          ascendant,
          midheaven,
          sunSign,
          moonSign,
          risingSign,
          aspects,
          elementBalance,
          qualityBalance
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate chart');
      } finally {
        setLoading(false);
      }
    };

    generateChart();
  }, [birthDate, birthTime, latitude, longitude, Ephemeris, isLoading, horoscopeError]);

  const getPlanetPosition = (planet: PlanetPosition) => {
    const angle = planet.longitude;
    const radius = 120; // Chart radius
    const centerX = 150;
    const centerY = 150;
    
    const x = centerX + radius * Math.cos((angle - 90) * Math.PI / 180);
    const y = centerY + radius * Math.sin((angle - 90) * Math.PI / 180);
    
    return { x, y };
  };

  const getAspectLine = (aspect: Aspect) => {
    const planet1 = chartData?.planets.find(p => p.name === aspect.planet1.toLowerCase());
    const planet2 = chartData?.planets.find(p => p.name === aspect.planet2.toLowerCase());
    
    if (!planet1 || !planet2) return null;
    
    const pos1 = getPlanetPosition(planet1);
    const pos2 = getPlanetPosition(planet2);
    
    return { x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading Circular Natal Horoscope...</p>
        </div>
      </div>
    );
  }

  if (horoscopeError) {
    return (
      <div className="text-center p-6">
        <div className="text-red-400 mb-4">
          <Zap size={48} className="mx-auto mb-2" />
          <p className="text-lg font-semibold text-white">Circular Natal Horoscope Error</p>
          <p className="text-sm text-white">{horoscopeError}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Calculating enhanced chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <div className="text-red-400 mb-4">
          <Zap size={48} className="mx-auto mb-2" />
          <p className="text-lg font-semibold text-white">Error calculating chart</p>
          <p className="text-sm text-white">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!chartData) return null;

  return (
    <div className="bg-black/20 rounded-lg border border-white/20 p-6 text-white">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {name}
        </h2>
        <div className="flex items-center justify-center space-x-4 text-white/70 text-sm">
          <div className="flex items-center">
            <Target size={16} className="mr-1" />
            {birthDate.toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <Compass size={16} className="mr-1" />
            {birthTime}
          </div>
          <div className="flex items-center">
            <Star size={16} className="mr-1" />
            {latitude.toFixed(2)}°, {longitude.toFixed(2)}°
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Enhanced Natal Chart Circle */}
        <div className="flex-1">
          <div className="relative w-80 h-80 mx-auto">
            <svg width="300" height="300" className="mx-auto">
              {/* Chart circle */}
              <circle
                cx="150"
                cy="150"
                r="140"
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Inner circle */}
              <circle
                cx="150"
                cy="150"
                r="120"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />

              {/* House lines */}
              {chartData.houses.map((house, index) => {
                const pos = getPlanetPosition({ longitude: house, name: '', latitude: 0, sign: '', degree: 0, minute: 0, element: '', quality: '', ruler: '' });
                return (
                  <line
                    key={`house-${index}`}
                    x1="150"
                    y1="150"
                    x2={pos.x}
                    y2={pos.y}
                    stroke="white"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Zodiac signs */}
              {ZODIAC_SIGNS.map((sign, index) => {
                const angle = index * 30;
                const pos = getPlanetPosition({ longitude: angle, name: '', latitude: 0, sign: '', degree: 0, minute: 0, element: '', quality: '', ruler: '' });
                return (
                  <text
                    key={sign}
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-white"
                  >
                    {sign.slice(0, 3)}
                  </text>
                );
              })}

              {/* Aspect lines */}
              {showAspects && chartData.aspects.map((aspect, index) => {
                const line = getAspectLine(aspect);
                if (!line) return null;
                
                const aspectColors = {
                  conjunction: '#FFD700',
                  sextile: '#00FF00',
                  square: '#FF0000',
                  trine: '#0000FF',
                  opposition: '#FF00FF'
                };
                
                return (
                  <line
                    key={`aspect-${index}`}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={aspectColors[aspect.type as keyof typeof aspectColors] || '#666'}
                    strokeWidth="1"
                    opacity="0.6"
                  />
                );
              })}

              {/* Planets */}
              {chartData.planets.map((planet) => {
                const pos = getPlanetPosition(planet);
                return (
                  <g key={planet.name}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="8"
                      fill={PLANET_COLORS[planet.name] || '#666'}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-bold fill-white"
                    >
                      {PLANET_SYMBOLS[planet.name]}
                    </text>
                    {planet.isRetrograde && (
                      <text
                        x={pos.x + 12}
                        y={pos.y - 12}
                        className="text-xs fill-red-400"
                      >
                        R
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Ascendant and Midheaven */}
              <g>
                <text
                  x={getPlanetPosition({ longitude: chartData.ascendant, name: '', latitude: 0, sign: '', degree: 0, minute: 0, element: '', quality: '', ruler: '' }).x}
                  y={getPlanetPosition({ longitude: chartData.ascendant, name: '', latitude: 0, sign: '', degree: 0, minute: 0, element: '', quality: '', ruler: '' }).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-bold fill-yellow-400"
                >
                  AS
                </text>
                <text
                  x={getPlanetPosition({ longitude: chartData.midheaven, name: '', latitude: 0, sign: '', degree: 0, minute: 0, element: '', quality: '', ruler: '' }).x}
                  y={getPlanetPosition({ longitude: chartData.midheaven, name: '', latitude: 0, sign: '', degree: 0, minute: 0, element: '', quality: '', ruler: '' }).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-bold fill-yellow-400"
                >
                  MC
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Enhanced Data Analysis */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-4">
            Enhanced Analysis
          </h3>
          
          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 p-3 rounded-md">
              <div className="flex items-center mb-2">
                <Star size={16} className="mr-2 text-yellow-500" />
                <span className="font-medium text-white">Sun Sign</span>
              </div>
              <p className="text-lg font-bold text-white">
                {chartData.sunSign}
              </p>
            </div>
            
            <div className="bg-white/10 p-3 rounded-md">
              <div className="flex items-center mb-2">
                <Star size={16} className="mr-2 text-blue-500" />
                <span className="font-medium text-white">Moon Sign</span>
              </div>
              <p className="text-lg font-bold text-white">
                {chartData.moonSign}
              </p>
            </div>
            
            <div className="bg-white/10 p-3 rounded-md">
              <div className="flex items-center mb-2">
                <Star size={16} className="mr-2 text-purple-500" />
                <span className="font-medium text-white">Rising Sign</span>
              </div>
              <p className="text-lg font-bold text-white">
                {chartData.risingSign}
              </p>
            </div>
          </div>

          {/* Element Balance */}
          <div className="bg-white/10 rounded-md p-4 mb-4">
            <h4 className="font-semibold text-white mb-3">Element Balance</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(chartData.elementBalance).map(([element, count]) => (
                <div key={element} className="flex justify-between">
                  <span className="text-white/70">{element}</span>
                  <span className="font-medium text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Balance */}
          <div className="bg-white/10 rounded-md p-4 mb-4">
            <h4 className="font-semibold text-white mb-3">Quality Balance</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(chartData.qualityBalance).map(([quality, count]) => (
                <div key={quality} className="flex justify-between">
                  <span className="text-white/70">{quality}</span>
                  <span className="font-medium text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aspects Toggle */}
          <div className="flex items-center mb-4">
            <button
              onClick={() => setShowAspects(!showAspects)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                showAspects
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {showAspects ? 'Hide' : 'Show'} Aspects
            </button>
          </div>

          {/* Aspects List */}
          {showAspects && chartData.aspects.length > 0 && (
            <div className="bg-white/10 rounded-md p-4">
              <h4 className="font-semibold text-white mb-3">Major Aspects</h4>
              <div className="space-y-2">
                {chartData.aspects.slice(0, 10).map((aspect, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-white/70">
                      {aspect.planet1} {aspect.type} {aspect.planet2}
                    </span>
                    <span className="font-medium text-white">
                      {aspect.orbString}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
