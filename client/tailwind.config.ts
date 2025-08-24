import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // allow shared ui code at repo root if any:
    '../src/**/*.{js,ts,jsx,tsx}',
    '../app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: { extend: {} },
  plugins: [daisyui],
  daisyui: {
    themes: [
      'light',
      'dark',
      'forest',
      'sunset',
      'valentine', // passion
      'luxury',    // royal
      'night'      // midnight
    ],
  },
} satisfies Config
