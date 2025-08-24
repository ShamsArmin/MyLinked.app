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

/** The only place that mutates the DOM for theming. */
export function applyTheme(themeName: string) {
  const t = coerceDaisyTheme(themeName);
  const root = document.documentElement; // <html>

  // 1) Set data-theme on <html>
  root.setAttribute('data-theme', t);

  // 2) Remove dark class that triggers Tailwind `dark:` variants
  root.classList.remove('dark');

  // 3) Remove any nested data-theme that could override root
  document.querySelectorAll<HTMLElement>('[data-theme]').forEach((el) => {
    if (el !== root) el.removeAttribute('data-theme');
  });

  try { localStorage.setItem('theme', t); } catch {}
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[theme] applied', { requested: themeName, resolved: t });
  }
}
