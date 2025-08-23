import { useTheme as useThemeCtx, ThemeProvider } from "../context/ThemeContext";

export { ThemeProvider };
export const useTheme = useThemeCtx;

export function useApplyTheme() {
  const { setTheme } = useThemeCtx();
  return {
    mutate: (t: string) => { void setTheme(t); },
    isPending: false,
  };
}
