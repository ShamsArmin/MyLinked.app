import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'
import themes from 'daisyui/src/theming/themes'

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
      { royal: { ...themes.emerald } },
      { passion: { ...themes.valentine } },
    ],
  },
}

export default config

