import React, { createContext, useContext, useLayoutEffect, useState } from "react";
import { applyTheme, normalizeTheme } from "../lib/theme";
import { getUser, updateProfile } from "../lib/api";

type Ctx = { theme: string; setTheme: (t: string) => Promise<void> };
const ThemeCtx = createContext<Ctx>({ theme: "forest", setTheme: async () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return normalizeTheme(localStorage.getItem("theme") || undefined);
    } catch {
      return "forest";
    }
  });

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useLayoutEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await getUser();
        if (alive && u?.theme) {
          const t = normalizeTheme(u.theme);
          setThemeState(t);
          try { localStorage.setItem("theme", t); } catch {}
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const setTheme = async (next: string) => {
    const t = normalizeTheme(next);
    const prev = theme;
    setThemeState(t);
    try { localStorage.setItem("theme", t); } catch {}
    try {
      await updateProfile({ theme: t });
    } catch {
      setThemeState(prev);
      try { localStorage.setItem("theme", prev); } catch {}
    }
  };

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);
