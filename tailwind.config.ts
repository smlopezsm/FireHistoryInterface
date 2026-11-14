import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          base: '#07100F',
          surface: '#0D1816',
          elevated: '#111E1B',
          border: '#21312D',
          borderLight: '#2A3F3A',
        },
        fcText: {
          primary: '#EFF5ED',
          secondary: '#93A39C',
          muted: '#687771',
        },
        lime: {
          brand: '#B8EE68',
          hover: '#cbf58c',
          muted: '#84ad47',
        },
        sensor: {
          modis: '#68D9D0',
          viirs: '#FF9C55',
          high: '#FF6759',
          warm: '#FFA64D',
          mild: '#3D786E',
        },
        surface: {
          light: '#07100F',
          card: '#0D1816',
          subtle: '#111E1B',
        },
        text: {
          main: '#EFF5ED',
          secondary: '#93A39C',
          muted: '#687771',
        },
        focos: {
          1: '#1A332C',
          2: '#285448',
          3: '#3D786E',
          4: '#68D9D0',
          5: '#FFB347',
          6: '#FF9C55',
          7: '#FF6759',
        },
        anomalia: {
          cold: '#68D9D0',
          warm: '#FF9C55',
          neutral: '#93A39C',
          extreme: '#FF6759',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        title: ['"Manrope"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
