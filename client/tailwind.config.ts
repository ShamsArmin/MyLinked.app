import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // allow shared UI code from root if you import it
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
      'valentine', // maps to "passion"
      'luxury',    // maps to "royal"
      'night'      // maps to "midnight"
    ],
  },
} satisfies Config
