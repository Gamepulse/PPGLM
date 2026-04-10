import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type Theme = 'light' | 'dark';
export type ColorSkin = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'violet';

interface SkinConfig {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  icon: string;
}

export const SKIN_CONFIGS: Record<ColorSkin, SkinConfig> = {
  indigo: {
    name: 'Indigo',
    primary: 'indigo',
    secondary: 'indigo',
    accent: 'indigo',
    icon: '🔵',
  },
  emerald: {
    name: 'Emerald',
    primary: 'emerald',
    secondary: 'emerald',
    accent: 'emerald',
    icon: '🟢',
  },
  rose: {
    name: 'Rose',
    primary: 'rose',
    secondary: 'rose',
    accent: 'rose',
    icon: '🔴',
  },
  amber: {
    name: 'Amber',
    primary: 'amber',
    secondary: 'amber',
    accent: 'amber',
    icon: '🟡',
  },
  cyan: {
    name: 'Cyan',
    primary: 'cyan',
    secondary: 'cyan',
    accent: 'cyan',
    icon: '💎',
  },
  violet: {
    name: 'Violet',
    primary: 'violet',
    secondary: 'violet',
    accent: 'violet',
    icon: '🟣',
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colorSkin: ColorSkin;
  setColorSkin: (skin: ColorSkin) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'pascal-theme';
const STORAGE_KEY_SKIN = 'pascal-color-skin';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  const [colorSkin, setColorSkinState] = useState<ColorSkin>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SKIN);
    const validSkins: ColorSkin[] = ['indigo', 'emerald', 'rose', 'amber', 'cyan', 'violet'];
    if (saved && validSkins.includes(saved as ColorSkin)) {
      return saved as ColorSkin;
    }
    return 'indigo';
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    // Apply theme class to document
    if (newTheme === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  const setColorSkin = useCallback((newSkin: ColorSkin) => {
    setColorSkinState(newSkin);
    localStorage.setItem(STORAGE_KEY_SKIN, newSkin);
    // Apply color skin class to document
    const validSkins: ColorSkin[] = ['indigo', 'emerald', 'rose', 'amber', 'cyan', 'violet'];
    validSkins.forEach(skin => {
      document.documentElement.classList.remove(`skin-${skin}`);
    });
    document.documentElement.classList.add(`skin-${newSkin}`);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Apply theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    // Apply color skin
    const validSkins: ColorSkin[] = ['indigo', 'emerald', 'rose', 'amber', 'cyan', 'violet'];
    validSkins.forEach(skin => {
      document.documentElement.classList.remove(`skin-${skin}`);
    });
    document.documentElement.classList.add(`skin-${colorSkin}`);
  }, [theme, colorSkin]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, colorSkin, setColorSkin }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
