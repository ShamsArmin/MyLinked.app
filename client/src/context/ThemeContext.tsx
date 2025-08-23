import React, { createContext, useContext, useEffect, useState } from "react";
import { applyTheme, loadInitialTheme } from "../lib/theme";
import { getUser, updateProfile } from "../lib/api";

type ThemeCtx = { theme: string; setTheme: (t: string) => Promise<void> };
const Ctx = createContext<ThemeCtx>({ theme: "light", setTheme: async () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>(loadInitialTheme() || "light");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await getUser().catch(() => null);
      if (user?.theme && mounted) {
        setThemeState(user.theme);
        applyTheme(user.theme);
        try { localStorage.setItem("theme", user.theme); } catch {}
      } else {
        applyTheme(theme);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setTheme = async (next: string) => {
    const prev = theme;
    setThemeState(next);
    applyTheme(next);
    try { localStorage.setItem("theme", next); } catch {}
    try {
      await updateProfile({ theme: next });
    } catch {
      setThemeState(prev);
      applyTheme(prev);
      try { localStorage.setItem("theme", prev); } catch {}
    }
  };

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
