import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#effef7',
          100: '#dafeef',
          200: '#b8fddf',
          300: '#81fac6',
          400: '#3ef2a1',
          500: '#13d981',
          600: '#0db56a',
          700: '#0e8f56',
          800: '#117145',
          900: '#105d3b',
          950: '#053422',
        },
        secondary: {
          50: '#f0f4ff',
          100: '#dde6fe',
          200: '#c2d1fd',
          300: '#9cb3fb',
          400: '#758ff6',
          500: '#5769ef',
          600: '#3f49e3',
          700: '#3439c8',
          800: '#2e32a3',
          900: '#2a3082',
          950: '#1a1c4c',
        },
        surface: {
          dark: '#0f172a',
          card: '#1e293b',
          light: '#f8fafc',
        },
      },
    },
  },
  plugins: [],
};

export default config;
