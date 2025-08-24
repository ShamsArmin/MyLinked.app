import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './use-auth';

type Theme = 'default' | 'minimal' | 'vibrant' | 'professional' | string;
type Font = 'inter' | 'poppins' | 'roboto' | 'montserrat' | 'opensans' | string;
type ViewMode = 'list' | 'grid' | 'story' | 'portfolio';

interface ThemeContextType {
  darkMode: boolean;
  theme: Theme;
  font: Font;
  viewMode: ViewMode;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Exported helper to allow theme colors to be applied outside the provider
export const getThemeColors = (themeId: string) => {
  const themes = {
      'ocean': {
        primary: '217 91% 60%', // Blue
        secondary: '221 83% 40%',
        accent: '188 91% 43%',
        background: '0 0% 100%',
        foreground: '220 14% 18%',
        border: '220 13% 91%',
        card: '0 0% 100%',
        cardForeground: '220 14% 18%'
      },
      'default': { // Same as ocean for themes-page.tsx compatibility
        primary: '217 91% 60%',
        secondary: '221 83% 40%',
        accent: '188 91% 43%',
        background: '0 0% 100%',
        foreground: '220 14% 18%',
        border: '220 13% 91%',
        card: '0 0% 100%',
        cardForeground: '220 14% 18%'
      },
      'sunset': {
        primary: '24 95% 53%', // Orange
        secondary: '20 91% 48%',
        accent: '43 96% 56%',
        background: '48 100% 96%',
        foreground: '30 95% 19%',
        border: '24 100% 83%',
        card: '0 0% 100%',
        cardForeground: '30 95% 19%'
      },
      'forest': {
        primary: '158 64% 52%', // Green
        secondary: '160 84% 39%',
        accent: '154 71% 59%',
        background: '138 76% 97%',
        foreground: '166 84% 15%',
        border: '142 69% 82%',
        card: '0 0% 100%',
        cardForeground: '166 84% 15%'
      },
      'midnight': {
        primary: '243 75% 59%', // Purple
        secondary: '243 69% 53%',
        accent: '258 90% 66%',
        background: '222 84% 5%',
        foreground: '213 31% 91%',
        border: '215 28% 17%',
        card: '222 84% 7%',
        cardForeground: '213 31% 91%'
      },
      'royal': {
        primary: '262 83% 58%', // Royal purple
        secondary: '263 70% 50%',
        accent: '270 91% 65%',
        background: '270 100% 98%', // Light purple background
        foreground: '270 91% 27%', // Dark purple text
        border: '270 40% 85%', // Purple border
        card: '0 0% 100%',
        cardForeground: '270 91% 27%'
      },
      'passion': {
        primary: '0 78% 50%', // Passion red
        secondary: '0 77% 42%',
        accent: '0 70% 70%',
        background: '0 93% 97%', // Light red background
        foreground: '0 73% 25%', // Dark red text
        border: '0 93% 83%', // Red border
        card: '0 0% 100%',
        cardForeground: '0 73% 25%'
      },
      'vibrant': {
        primary: '24 95% 53%', // Vibrant orange
        secondary: '20 91% 48%',
        accent: '43 96% 56%',
        background: '0 0% 100%',
        foreground: '20 14% 4%',
        border: '20 6% 90%',
        card: '0 0% 100%',
        cardForeground: '20 14% 4%'
      },
      'minimal': {
        primary: '220 9% 46%', // Gray
        secondary: '215 14% 34%',
        accent: '220 13% 69%',
        background: '0 0% 100%',
        foreground: '220 9% 46%',
        border: '220 13% 91%',
        card: '0 0% 100%',
        cardForeground: '220 9% 46%'
      },
      'professional': {
        primary: '243 75% 59%', // Indigo
        secondary: '243 69% 53%',
        accent: '258 90% 66%',
        background: '0 0% 100%',
        foreground: '220 14% 18%',
        border: '220 13% 91%',
        card: '0 0% 100%',
        cardForeground: '220 14% 18%'
      }
    };

  return themes[themeId as keyof typeof themes] || themes.default;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Get auth context
  const { user } = useAuth();

  // Initial defaults
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState<Theme>('default');
  const [font, setFont] = useState<Font>('inter');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [darkMode, setDarkMode] = useState(false);

  // Function to get CSS font family based on font name
  const getFontFamily = (fontName: string | undefined): string => {
    switch (fontName) {
      case 'poppins':
        return '"Poppins", sans-serif';
      case 'roboto':
        return '"Roboto", sans-serif';
      case 'montserrat':
        return '"Montserrat", sans-serif';
      case 'opensans':
        return '"Open Sans", sans-serif';
      case 'inter':
      default:
        return '"Inter", sans-serif';
    }
  };

  // Fetch user's profile settings only when authenticated
  const { data: profile } = useQuery<any>({
    queryKey: ['/api/profile'],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Apply theme settings whenever user or profile changes
  useEffect(() => {
    // Use profile data if available, otherwise use user data
    const source = profile || user;
    
    if (source) {
      // Get values with fallbacks
      const userDarkMode = source.darkMode === true;
      const userTheme = source.theme || 'default';
      const userFont = source.font || 'inter';
      const userViewMode = source.viewMode || 'list';
      
      // Set state values
      setDarkMode(userDarkMode);
      setIsDarkMode(userDarkMode);
      setTheme(userTheme);
      setFont(userFont);
      setViewMode(userViewMode as ViewMode);
      
      // Apply dark mode to document
      document.documentElement.classList.toggle('dark', userDarkMode);
      
      // Apply font to document
      document.documentElement.style.setProperty('--font-primary', getFontFamily(userFont));
      
      // Apply custom CSS variables for the selected theme
      const themeColors = getThemeColors(userTheme);
      if (themeColors) {
        document.documentElement.style.setProperty('--primary', themeColors.primary);
        document.documentElement.style.setProperty('--secondary', themeColors.secondary);
        document.documentElement.style.setProperty('--accent', themeColors.accent);
        document.documentElement.style.setProperty('--background', themeColors.background);
        document.documentElement.style.setProperty('--foreground', themeColors.foreground);
        document.documentElement.style.setProperty('--border', themeColors.border);
        document.documentElement.style.setProperty('--card', themeColors.card);
        document.documentElement.style.setProperty('--card-foreground', themeColors.cardForeground);
        document.documentElement.style.setProperty('--card', themeColors.card);
        document.documentElement.style.setProperty('--card-foreground', themeColors.cardForeground);
      }
      
      // Apply font style to body
      document.body.style.fontFamily = getFontFamily(userFont);
      
      // Make body changes based on theme
      document.body.className = '';
      document.body.classList.add(`theme-${userTheme}`);
      if (userDarkMode) {
        document.body.classList.add('dark');
      }
    }
  }, [user, profile]);

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        theme,
        font,
        viewMode,
        isDarkMode,
        setIsDarkMode
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useApplyTheme() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (theme: string) => {
      const updatedUser = await apiRequest("PATCH", "/api/profile", { theme });
      return updatedUser; // treat as success if no throw
    },
    onSuccess: (_data, theme) => {
      try {
        document.documentElement.setAttribute("data-theme", theme);
        document.body.classList.forEach((c) => {
          if (c.startsWith("theme-")) document.body.classList.remove(c);
        });
        document.body.classList.add(`theme-${theme}`);

        // Immediately apply CSS variables for the selected theme
          const themeColors = getThemeColors(theme);
          document.documentElement.style.setProperty('--primary', themeColors.primary);
          document.documentElement.style.setProperty('--secondary', themeColors.secondary);
          document.documentElement.style.setProperty('--accent', themeColors.accent);
          document.documentElement.style.setProperty('--background', themeColors.background);
          document.documentElement.style.setProperty('--foreground', themeColors.foreground);
          document.documentElement.style.setProperty('--border', themeColors.border);
          document.documentElement.style.setProperty('--card', themeColors.card);
          document.documentElement.style.setProperty('--card-foreground', themeColors.cardForeground);
      } catch (e) {
        console.warn("Theme DOM update warning:", e);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });

      toast({
        title: "Theme applied",
        description: `Your theme is now "${theme}".`,
      });
    },
    onError: (e: any) => {
      console.error("Theme apply error:", e);
      const msg = e?.message || "Unknown error";
      toast({
        title: "Theme apply failed",
        description: msg,
        variant: "destructive",
      });
    },
  });
}