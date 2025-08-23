export const KNOWN_THEMES = new Set(["light","dark","forest","sunset","royal","passion"]);
export function normalizeTheme(t?: string) {
  if (t && KNOWN_THEMES.has(t)) return t;
  if (t) console.warn(`Unknown theme "${t}", falling back to "forest"`);
  return "forest";
}
export function applyTheme(theme: string) {
  document.documentElement.setAttribute("data-theme", normalizeTheme(theme));
}
