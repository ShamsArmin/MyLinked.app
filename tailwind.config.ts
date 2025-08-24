import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './client/src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: { extend: {} },
  plugins: [daisyui],
  daisyui: {
    themes: [
      'light',
      'dark',
      'forest',
      'sunset',
      'valentine',
      'luxury',
      'night'
    ],
  },
}

export default config
