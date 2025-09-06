'use client';

import React, { useState, useEffect } from 'react';
import { useHoroscope } from '../lib/horoscope-client';

interface ChartData {
  planets: Planet[];
  houses: House[];
  ascendant: number;
  midheaven: number;
  aspects: Aspect[];
}

interface Planet {
  name: string;
  longitude: number;
  latitude: number;
  sign: string;
  degree: number;
  minute: number;
  retrograde: boolean;
  house: number;
}

interface House {
  number: number;
  longitude: number;
  sign: string;
  degree: number;
  minute: number;
}

interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  orbString: string;
}

const PLANET_SYMBOLS = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const ZODIAC_DATA = {
  Aries: { symbol: '♈', element: 'Fire', quality: 'Cardinal' },
  Taurus: { symbol: '♉', element: 'Earth', quality: 'Fixed' },
  Gemini: { symbol: '♊', element: 'Air', quality: 'Mutable' },
  Cancer: { symbol: '♋', element: 'Water', quality: 'Cardinal' },
  Leo: { symbol: '♌', element: 'Fire', quality: 'Fixed' },
  Virgo: { symbol: '♍', element: 'Earth', quality: 'Mutable' },
  Libra: { symbol: '♎', element: 'Air', quality: 'Cardinal' },
  Scorpio: { symbol: '♏', element: 'Water', quality: 'Fixed' },
  Sagittarius: { symbol: '♐', element: 'Fire', quality: 'Mutable' },
  Capricorn: { symbol: '♑', element: 'Earth', quality: 'Cardinal' },
  Aquarius: { symbol: '♒', element: 'Air', quality: 'Fixed' },
  Pisces: { symbol: '♓', element: 'Water', quality: 'Mutable' },
};

const PLANET_COLORS = {
  Sun: '#FFD700',
  Moon: '#C0C0C0',
  Mercury: '#87CEEB',
  Venus: '#FFB6C1',
  Mars: '#FF6347',
  Jupiter: '#DDA0DD',
  Saturn: '#F0E68C',
  Uranus: '#40E0D0',
  Neptune: '#4169E1',
  Pluto: '#8B4513',
};

const getZodiacSign = (longitude: number): string => {
  const signIndex = Math.floor(longitude / 30);
  return ZODIAC_SIGNS[signIndex];
};

const getDegreeInSign = (longitude: number): number => {
  return longitude % 30;
};

const getMinute = (longitude: number): number => {
  const degree = getDegreeInSign(longitude);
  return Math.floor((degree - Math.floor(degree)) * 60);
};

interface AstrologyChartProps {
  dateTime: Date;
  latitude: number;
  longitude: number;
  name?: string;
}

export const AstrologyChart: React.FC<AstrologyChartProps> = ({ dateTime, latitude, longitude, name }) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { Ephemeris, isLoading: horoscopeLoading, error: horoscopeError } = useHoroscope();

  useEffect(() => {
    const generateChart = async () => {
      if (horoscopeLoading) return;
      
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
        
        // Get planetary positions using ephemeris
        const ephemerisData = Ephemeris.getAllPlanets(dateTime, latitude, longitude);
        
        // Get planetary positions
        const planets: Planet[] = [];
        const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
        
        for (const planetName of planetNames) {
          try {
            const planetData = ephemerisData.observed[planetName];
            if (planetData) {
              const longitude = planetData.apparentLongitudeDd;
              const latitude = 0; // Ephemeris doesn't provide latitude
              const sign = getZodiacSign(longitude);
              const degree = Math.floor(getDegreeInSign(longitude));
              const minute = getMinute(longitude);
              const retrograde = planetData.is_retrograde || false;
              const house = 1; // We'll calculate houses separately
              
              planets.push({
                name: planetName.charAt(0).toUpperCase() + planetName.slice(1),
                longitude: longitude,
                latitude: latitude,
                sign,
                degree,
                minute,
                retrograde,
                house,
              });
            }
          } catch (error) {
            console.error(`Error calculating position for ${planetName}:`, error);
          }
        }

        // Calculate houses (simplified - using equal house system)
        const houses: House[] = [];
        const ascendant = 0; // We'll calculate this separately
        
        for (let i = 0; i < 12; i++) {
          const houseLongitude = (ascendant + (i * 30)) % 360;
          const sign = getZodiacSign(houseLongitude);
          const degree = Math.floor(getDegreeInSign(houseLongitude));
          const minute = getMinute(houseLongitude);
          
          houses.push({
            number: i + 1,
            longitude: houseLongitude,
            sign,
            degree,
            minute,
          });
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

        setChartData({
          planets,
          houses,
          ascendant: 0, // Simplified for now
          midheaven: 0, // Simplified for now
          aspects,
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate chart');
      } finally {
        setLoading(false);
      }
    };

    generateChart();
  }, [dateTime, latitude, longitude, Ephemeris, horoscopeLoading, horoscopeError]);

  if (horoscopeLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading Circular Natal Horoscope...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error generating chart</p>
          <p className="text-sm text-white">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Calculating chart...</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return null;
  }

  return (
    <div className="space-y-6 text-white">
      {/* Chart Title */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white">Natal Chart</h3>
        {name && <p className="text-white/80">{name}</p>}
        <p className="text-sm text-white/70">
          {dateTime.toLocaleDateString()} at {dateTime.toLocaleTimeString()}
        </p>
      </div>

      {/* Chart Visualization */}
      <div className="flex justify-center">
        <svg width="300" height="300" className="mx-auto">
          {/* Chart circles */}
          <circle cx="150" cy="150" r="140" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="150" cy="150" r="120" fill="none" stroke="white" strokeWidth="1" />
          
          {/* Zodiac signs */}
          {ZODIAC_SIGNS.map((sign, index) => {
            const angle = (index * 30 - 15) * (Math.PI / 180);
            const x = 150 + 130 * Math.cos(angle);
            const y = 150 + 130 * Math.sin(angle);
            
            return (
              <text key={sign} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-sm fill-white">
                {ZODIAC_DATA[sign as keyof typeof ZODIAC_DATA].symbol}
              </text>
            );
          })}
          
          {/* Planets */}
          {chartData.planets.map((planet) => {
            const angle = (planet.longitude - 15) * (Math.PI / 180);
            const x = 150 + 110 * Math.cos(angle);
            const y = 150 + 110 * Math.sin(angle);
            
            return (
              <g key={planet.name}>
                <circle cx={x} cy={y} r="8" fill={PLANET_COLORS[planet.name as keyof typeof PLANET_COLORS]} />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold fill-white">
                  {PLANET_SYMBOLS[planet.name as keyof typeof PLANET_SYMBOLS]}
                </text>
                {planet.retrograde && (
                  <text x={x + 12} y={y - 8} className="text-xs fill-red-400">R</text>
                )}
              </g>
            );
          })}
          
          {/* House cusps */}
          {chartData.houses.map((house) => {
            const angle = (house.longitude - 15) * (Math.PI / 180);
            const x1 = 150 + 120 * Math.cos(angle);
            const y1 = 150 + 120 * Math.sin(angle);
            const x2 = 150 + 140 * Math.cos(angle);
            const y2 = 150 + 140 * Math.sin(angle);
            
            return (
              <line key={house.number} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1" />
            );
          })}
          
          {/* Angles */}
          <g>
            <text x={150} y={10} textAnchor="middle" className="text-xs fill-white">AS</text>
            <text x={150} y={290} textAnchor="middle" className="text-xs fill-white">MC</text>
          </g>
        </svg>
      </div>

      {/* Planetary Positions Table */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Planetary Positions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartData.planets.map((planet) => (
            <div key={planet.name} className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{PLANET_SYMBOLS[planet.name as keyof typeof PLANET_SYMBOLS]}</span>
                <span className="font-medium text-white">{planet.name}</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-white">
                  {planet.degree}° {planet.minute}&apos; {ZODIAC_DATA[planet.sign as keyof typeof ZODIAC_DATA].symbol}
                </div>
                <div className="text-sm text-white/70">
                  {planet.sign} {planet.retrograde && '(R)'} • House {planet.house}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* House Positions */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">House Cusps</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {chartData.houses.map((house) => (
            <div key={house.number} className="p-3 bg-white/10 rounded-lg border border-white/20 text-center">
              <div className="font-medium text-white">House {house.number}</div>
              <div className="text-sm text-white">
                {house.degree}° {house.minute}&apos; {ZODIAC_DATA[house.sign as keyof typeof ZODIAC_DATA].symbol}
              </div>
              <div className="text-xs text-white/70">{house.sign}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white/10 rounded-lg border border-white/20">
          <h5 className="font-semibold mb-2 text-white">Ascendant</h5>
          <p className="text-sm text-white">
            {Math.floor(getDegreeInSign(chartData.ascendant))}° {getMinute(chartData.ascendant)}&apos; {ZODIAC_DATA[getZodiacSign(chartData.ascendant) as keyof typeof ZODIAC_DATA].symbol}
          </p>
          <p className="text-xs text-white/70">{getZodiacSign(chartData.ascendant)}</p>
        </div>
        
        <div className="p-4 bg-white/10 rounded-lg border border-white/20">
          <h5 className="font-semibold mb-2 text-white">Midheaven</h5>
          <p className="text-sm text-white">
            {Math.floor(getDegreeInSign(chartData.midheaven))}° {getMinute(chartData.midheaven)}&apos; {ZODIAC_DATA[getZodiacSign(chartData.midheaven) as keyof typeof ZODIAC_DATA].symbol}
          </p>
          <p className="text-xs text-white/70">{getZodiacSign(chartData.midheaven)}</p>
        </div>
        
        <div className="p-4 bg-white/10 rounded-lg border border-white/20">
          <h5 className="font-semibold mb-2 text-white">Location</h5>
          <p className="text-sm text-white">{latitude.toFixed(2)}°N, {longitude.toFixed(2)}°E</p>
        </div>
      </div>

      {/* Aspects */}
      {chartData.aspects.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Major Aspects</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chartData.aspects.slice(0, 12).map((aspect, index) => (
              <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white">{aspect.planet1} {aspect.type} {aspect.planet2}</span>
                  <span className="text-sm text-white/70">{aspect.orbString}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
