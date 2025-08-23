export function applyTheme(theme: string) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
}

export function loadInitialTheme(): string | null {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}
