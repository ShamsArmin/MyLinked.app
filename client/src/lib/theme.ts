export type AppTheme =
  | 'light'
  | 'dark'
  | 'forest'
  | 'sunset'
  | 'midnight'
  | 'passion'
  | 'royal';

const MAP: Record<string, string> = {
  light: 'light',
  dark: 'dark',
  forest: 'forest',
  sunset: 'sunset',
  midnight: 'night',
  passion: 'valentine',
  royal: 'luxury',
};

export function coerceDaisyTheme(input?: string): string {
  const key = (input || '').toLowerCase().trim();
  return MAP[key] || 'forest';
}

export function applyTheme(themeName: string) {
  const t = coerceDaisyTheme(themeName);
  const root = document.documentElement;
  root.setAttribute('data-theme', t);
  root.classList.remove('dark'); // prevent Tailwind dark from overriding

  // avoid nested overrides
  document.querySelectorAll<HTMLElement>('[data-theme]').forEach((el) => {
    if (el !== root) el.removeAttribute('data-theme');
  });

  try { localStorage.setItem('theme', t); } catch {}
  if (import.meta.env?.MODE !== 'production') {
    console.debug('[theme] applied', { requested: themeName, resolved: t });
  }
}
