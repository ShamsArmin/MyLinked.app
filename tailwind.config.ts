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
    /**
     * Use built-ins and alias custom names used by the UI.
     * If you don’t need aliases, you can list only strings.
     */
    themes: [
      'light',
      'dark',
      'forest',
      'sunset',
      // Aliases for app’s custom options:
      { royal: { ...themes['emerald'] } },
      { passion: { ...themes['valentine'] } }
    ]
  }
}

export default config
