# Astrology Chart System

A comprehensive astrology chart generation system built with Next.js, TypeScript, and the Swiss Ephemeris WebAssembly library for precise astronomical calculations.

## Features

### 🌟 Core Functionality
- **Precise Planetary Calculations**: Uses Swiss Ephemeris WebAssembly for high-precision astronomical calculations
- **Natal Chart Generation**: Complete birth charts with all major planets and points
- **Aspect Analysis**: Automatic calculation of planetary aspects and orbs
- **Element & Quality Balance**: Analysis of elemental and modal distributions
- **Retrograde Detection**: Identifies retrograde planetary motion
- **Location-Based Calculations**: Accurate charts based on birth location coordinates

### 🎨 Visual Components
- **Interactive Chart Display**: SVG-based natal chart visualization
- **Planetary Symbols**: Traditional astrological symbols for all planets
- **Aspect Lines**: Visual representation of planetary aspects
- **Color-Coded Elements**: Distinct colors for different planetary bodies
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 📊 Analysis Features
- **Sun, Moon, Rising Signs**: Key astrological indicators
- **House System**: Equal house system implementation
- **Element Balance**: Fire, Earth, Air, Water distribution
- **Quality Balance**: Cardinal, Fixed, Mutable distribution
- **Detailed Tables**: Comprehensive planetary position data

## Components

### 1. AstrologyChart.tsx
Basic natal chart component with:
- Planetary positions calculation
- Chart circle visualization
- Basic aspect detection
- Planetary status indicators

### 2. EnhancedAstrologyChart.tsx
Advanced chart component featuring:
- Detailed aspect analysis with orbs
- Element and quality balance charts
- Interactive aspect toggles
- Comprehensive planetary data tables
- Zodiac symbol integration

### 3. AstrologyChartForm.tsx
User input form with:
- Birth date and time selection
- Location coordinate input
- Common city presets
- Form validation
- Error handling

### 4. AstrologyManagement.tsx
Admin management interface with:
- Chart creation and management
- Saved charts functionality
- Download and sharing capabilities
- Educational content

### 5. AstrologySection.tsx
Client-facing section featuring:
- Beautiful gradient design
- Interactive chart generation
- Educational content
- Responsive layout

## Installation

The system uses the `sweph-wasm` library for astronomical calculations:

```bash
npm install sweph-wasm
```

## Usage

### Basic Chart Generation

```tsx
import { AstrologyChart } from './components/AstrologyChart';

<AstrologyChart
  birthDate={new Date('1990-01-01')}
  birthTime="12:00"
  latitude={40.7128}
  longitude={-74.0060}
  name="John Doe's Chart"
/>
```

### Enhanced Chart with Analysis

```tsx
import { EnhancedAstrologyChart } from './components/EnhancedAstrologyChart';

<EnhancedAstrologyChart
  birthDate={new Date('1990-01-01')}
  birthTime="12:00"
  latitude={40.7128}
  longitude={-74.0060}
  name="Detailed Analysis"
/>
```

### Form Integration

```tsx
import { AstrologyChartForm } from './components/AstrologyChartForm';

<AstrologyChartForm
  onSubmit={(data) => {
    console.log('Chart data:', data);
    // Handle chart generation
  }}
  loading={false}
/>
```

## Technical Implementation

### Swiss Ephemeris Integration
The system uses the Swiss Ephemeris WebAssembly library to calculate precise planetary positions:

```typescript
import SwephWasm from 'sweph-wasm';

const swe = await SwephWasm.init();
await swe.swe_set_ephe_path();
const jd = swe.swe_julday(year, month, day, hour, 1);
const position = swe.swe_calc_ut(jd, planetId, 0);
```

### Planetary Calculations
- **Longitude**: Apparent longitude in degrees
- **Latitude**: Apparent latitude in degrees
- **Distance**: Geocentric distance in kilometers
- **Retrograde**: Boolean indicating retrograde motion

### Aspect Calculations
The system calculates major aspects with configurable orbs:
- **Conjunction**: 0° ± 8°
- **Sextile**: 60° ± 4°
- **Square**: 90° ± 8°
- **Trine**: 120° ± 8°
- **Opposition**: 180° ± 8°

### Chart Visualization
- **SVG-based**: Scalable vector graphics for crisp display
- **Polar coordinates**: Planets positioned using angular calculations
- **Color coding**: Distinct colors for each planetary body
- **Interactive elements**: Toggleable aspect lines and controls

## Data Structures

### PlanetPosition Interface
```typescript
interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  distance: number;
  isRetrograde?: boolean;
  house?: number;
  sign: string;
  degree: number;
  minute: number;
  element: string;
  quality: string;
  ruler: string;
}
```

### Aspect Interface
```typescript
interface Aspect {
  planet1: string;
  planet2: string;
  type: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  orb: number;
  orbString: string;
}
```

## Styling

The system follows the centralized styling approach using CSS custom properties:

```css
/* Chart colors */
--color-primary-500: #3b82f6;
--color-secondary-500: #8b5cf6;
--color-border-500: #6b7280;
--color-background-primary: #ffffff;
--color-background-secondary: #f9fafb;
```

## Admin Integration

The astrology system is integrated into the admin dashboard:

1. **Navigation**: Added "Astrology Charts" tab in admin sidebar
2. **Management**: Full CRUD operations for charts
3. **Analysis**: Enhanced chart viewing and analysis tools
4. **Export**: Download and sharing capabilities

## Client Integration

The astrology section can be added to the main page:

```tsx
import { AstrologySection } from './components/AstrologySection';

// In your main page component
<AstrologySection className="my-16" />
```

## Educational Content

The system includes comprehensive educational content:
- **Chart Interpretation**: How to read natal charts
- **Element Meanings**: Understanding Fire, Earth, Air, Water
- **Quality Meanings**: Cardinal, Fixed, Mutable characteristics
- **Aspect Meanings**: Planetary relationship interpretations

## Future Enhancements

### Planned Features
- **Transit Charts**: Current planetary positions vs. natal chart
- **Progressed Charts**: Secondary progressions
- **Synastry Charts**: Relationship compatibility analysis
- **Solar Return Charts**: Annual birthday charts
- **House Systems**: Multiple house system options (Placidus, Koch, etc.)
- **Asteroids**: Additional celestial bodies (Ceres, Pallas, Juno, Vesta)
- **Fixed Stars**: Major fixed star positions
- **Arabic Parts**: Lot of Fortune and other Arabic parts

### Technical Improvements
- **Performance**: Web Worker implementation for heavy calculations
- **Caching**: Chart result caching for better performance
- **Offline Support**: Service worker for offline functionality
- **Print Support**: High-quality chart printing
- **API Integration**: RESTful API for chart generation

## Dependencies

- **sweph-wasm**: Swiss Ephemeris WebAssembly for astronomical calculations
- **framer-motion**: Animations and transitions
- **lucide-react**: Icon library
- **tailwindcss**: Styling framework
- **typescript**: Type safety

## Contributing

When contributing to the astrology system:

1. **Follow TypeScript**: Maintain strict type safety
2. **Test Calculations**: Verify ephemeris calculations accuracy
3. **Update Documentation**: Keep README and comments current
4. **Follow Styling**: Use centralized CSS custom properties
5. **Add Tests**: Include unit tests for new features

## License

This astrology system is part of the larger project and follows the same licensing terms.

---

**Note**: This astrology system is for educational and entertainment purposes. While it uses precise astronomical calculations, astrological interpretations should be approached with appropriate perspective and not used as the sole basis for life decisions.
