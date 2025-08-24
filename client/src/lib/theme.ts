import { getThemeColors } from '@/hooks/use-theme'

export function applyTheme(theme: string) {
  if (typeof document === 'undefined') return

  document.documentElement.setAttribute('data-theme', theme)

  document.body.classList.forEach((c) => {
    if (c.startsWith('theme-')) document.body.classList.remove(c)
  })
  document.body.classList.add(`theme-${theme}`)

  const colors = getThemeColors(theme)
  document.documentElement.style.setProperty('--primary', colors.primary)
  document.documentElement.style.setProperty('--secondary', colors.secondary)
  document.documentElement.style.setProperty('--accent', colors.accent)
  document.documentElement.style.setProperty('--background', colors.background)
  document.documentElement.style.setProperty('--foreground', colors.foreground)
  document.documentElement.style.setProperty('--border', colors.border)
  document.documentElement.style.setProperty('--card', colors.card)
  document.documentElement.style.setProperty('--card-foreground', colors.cardForeground)
}

