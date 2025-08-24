import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { applyTheme, coerceDaisyTheme } from '../lib/theme';
import { getUser, updateProfile } from '../lib/api';

type ThemeCtx = { theme: string; setTheme: (t: string) => Promise<void> };
const Ctx = createContext<ThemeCtx>({ theme: 'forest', setTheme: async () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>(() => {
    try { return localStorage.getItem('theme') || 'forest'; } catch { return 'forest'; }
  });

  const mounted = useRef(false);

  // Apply immediately before paint
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // On first mount, sync from server once and reconcile
  useLayoutEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await getUser();
        const serverTheme = coerceDaisyTheme(u?.theme);
        if (alive) setThemeState(serverTheme);
      } catch {
        // ignore; keep local theme
      } finally {
        mounted.current = true;
      }
    })();
    return () => { alive = false; };
  }, []);

  const setTheme = async (next: string) => {
    const normalized = coerceDaisyTheme(next);
    const prev = theme;
    setThemeState(normalized);       // optimistic UI
    try {
      await updateProfile({ theme: normalized });
    } catch (e) {
      setThemeState(prev);           // rollback on failure
      throw e;
    }
  };

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
