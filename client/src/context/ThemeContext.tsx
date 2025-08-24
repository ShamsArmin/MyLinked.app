import React, { createContext, useContext, useLayoutEffect, useState } from 'react';
import { applyTheme, coerceDaisyTheme } from '../lib/theme';
import { getUser, updateProfile } from '../lib/api';

type ThemeCtx = { theme: string; setTheme: (t: string) => Promise<void> };
const Ctx = createContext<ThemeCtx>({ theme: 'forest', setTheme: async () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>(() => {
    try { return localStorage.getItem('theme') || 'forest'; } catch { return 'forest'; }
  });

  useLayoutEffect(() => { applyTheme(theme); }, [theme]);

  useLayoutEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await getUser();
        const serverTheme = coerceDaisyTheme(u?.theme);
        if (alive) setThemeState(serverTheme);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const setTheme = async (next: string) => {
    const normalized = coerceDaisyTheme(next);
    const prev = theme;
    setThemeState(normalized); // optimistic
    try { await updateProfile({ theme: normalized }); }
    catch (e) { setThemeState(prev); throw e; }
  };

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
