import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';

// Gaming-inspired complete themes
export type ColorTheme = 
  | 'indigo'      // Classic Blue (default)
  | 'cyberpunk'   // Neon Cyan/Magenta
  | 'matrix'      // Green Phosphor
  | 'synthwave'   // Purple/Pink/Sunset
  | 'arcade'      // Retro Primary Colors
  | 'midnight'    // Deep Blues
  | 'crimson'     // Red/Black Gaming
  | 'ocean'       // Teal/Blue
  | 'forest'      // Green/Nature
  | 'sunset';     // Orange/Purple

interface ColorThemeConfig {
  name: string;
  description: string;
  icon: string;
  // Light mode colors
  light: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentSecondary: string;
    border: string;
    cardBg: string;
    success: string;
    warning: string;
    error: string;
  };
  // Dark mode colors
  dark: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentSecondary: string;
    border: string;
    cardBg: string;
    success: string;
    warning: string;
    error: string;
  };
}

export const COLOR_THEMES: Record<ColorTheme, ColorThemeConfig> = {
  indigo: {
    name: 'Indigo',
    description: 'Classic blue theme',
    icon: '🔵',
    light: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f8fafc',
      bgTertiary: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#64748b',
      accent: '#4f46e5',
      accentHover: '#4338ca',
      accentSecondary: '#818cf8',
      border: '#cbd5e1',
      cardBg: '#ffffff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    dark: {
      bgPrimary: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      accent: '#6366f1',
      accentHover: '#4f46e5',
      accentSecondary: '#818cf8',
      border: '#334155',
      cardBg: '#1e293b',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  
  cyberpunk: {
    name: 'Cyberpunk',
    description: 'Neon cyan and magenta',
    icon: '🌆',
    light: {
      bgPrimary: '#f0f9ff',
      bgSecondary: '#e0f2fe',
      bgTertiary: '#bae6fd',
      textPrimary: '#0c4a6e',
      textSecondary: '#0369a1',
      textMuted: '#0284c7',
      accent: '#06b6d4',
      accentHover: '#0891b2',
      accentSecondary: '#ec4899',
      border: '#7dd3fc',
      cardBg: '#ffffff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#f43f5e',
    },
    dark: {
      bgPrimary: '#020617',
      bgSecondary: '#0f172a',
      bgTertiary: '#1e293b',
      textPrimary: '#e0f2fe',
      textSecondary: '#7dd3fc',
      textMuted: '#38bdf8',
      accent: '#06b6d4',
      accentHover: '#22d3ee',
      accentSecondary: '#ec4899',
      border: '#1e293b',
      cardBg: '#0f172a',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#fb7185',
    },
  },
  
  matrix: {
    name: 'Matrix',
    description: 'Green phosphor terminal',
    icon: '💻',
    light: {
      bgPrimary: '#f0fdf4',
      bgSecondary: '#dcfce7',
      bgTertiary: '#bbf7d0',
      textPrimary: '#14532d',
      textSecondary: '#166534',
      textMuted: '#15803d',
      accent: '#16a34a',
      accentHover: '#15803d',
      accentSecondary: '#22c55e',
      border: '#86efac',
      cardBg: '#ffffff',
      success: '#16a34a',
      warning: '#ca8a04',
      error: '#dc2626',
    },
    dark: {
      bgPrimary: '#022c22',
      bgSecondary: '#064e3b',
      bgTertiary: '#065f46',
      textPrimary: '#86efac',
      textSecondary: '#4ade80',
      textMuted: '#22c55e',
      accent: '#16a34a',
      accentHover: '#22c55e',
      accentSecondary: '#4ade80',
      border: '#065f46',
      cardBg: '#064e3b',
      success: '#4ade80',
      warning: '#facc15',
      error: '#f87171',
    },
  },
  
  synthwave: {
    name: 'Synthwave',
    description: 'Purple pink sunset',
    icon: '🌅',
    light: {
      bgPrimary: '#fdf4ff',
      bgSecondary: '#fae8ff',
      bgTertiary: '#f5d0fe',
      textPrimary: '#6b21a8',
      textSecondary: '#9333ea',
      textMuted: '#a855f7',
      accent: '#c026d3',
      accentHover: '#a21caf',
      accentSecondary: '#e879f9',
      border: '#e9d5ff',
      cardBg: '#ffffff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    dark: {
      bgPrimary: '#2e1065',
      bgSecondary: '#4c1d95',
      bgTertiary: '#5b21b6',
      textPrimary: '#fae8ff',
      textSecondary: '#e879f9',
      textMuted: '#d8b4fe',
      accent: '#c026d3',
      accentHover: '#e879f9',
      accentSecondary: '#f0abfc',
      border: '#6b21a8',
      cardBg: '#4c1d95',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  
  arcade: {
    name: 'Arcade',
    description: 'Retro gaming colors',
    icon: '🕹️',
    light: {
      bgPrimary: '#fefce8',
      bgSecondary: '#fef9c3',
      bgTertiary: '#fef08a',
      textPrimary: '#713f12',
      textSecondary: '#a16207',
      textMuted: '#ca8a04',
      accent: '#ea580c',
      accentHover: '#c2410c',
      accentSecondary: '#f97316',
      border: '#fde047',
      cardBg: '#ffffff',
      success: '#16a34a',
      warning: '#eab308',
      error: '#dc2626',
    },
    dark: {
      bgPrimary: '#1a1a2e',
      bgSecondary: '#16213e',
      bgTertiary: '#0f3460',
      textPrimary: '#fef9c3',
      textSecondary: '#fde047',
      textMuted: '#facc15',
      accent: '#f97316',
      accentHover: '#fb923c',
      accentSecondary: '#eab308',
      border: '#0f3460',
      cardBg: '#16213e',
      success: '#4ade80',
      warning: '#facc15',
      error: '#f87171',
    },
  },
  
  midnight: {
    name: 'Midnight',
    description: 'Deep ocean blue',
    icon: '🌙',
    light: {
      bgPrimary: '#f8fafc',
      bgSecondary: '#f1f5f9',
      bgTertiary: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      accent: '#0369a1',
      accentHover: '#075985',
      accentSecondary: '#0ea5e9',
      border: '#cbd5e1',
      cardBg: '#ffffff',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
    dark: {
      bgPrimary: '#020617',
      bgSecondary: '#0f172a',
      bgTertiary: '#1e293b',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      accent: '#0ea5e9',
      accentHover: '#38bdf8',
      accentSecondary: '#7dd3fc',
      border: '#1e293b',
      cardBg: '#0f172a',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  
  crimson: {
    name: 'Crimson',
    description: 'Red black gaming',
    icon: '🎮',
    light: {
      bgPrimary: '#fef2f2',
      bgSecondary: '#fee2e2',
      bgTertiary: '#fecaca',
      textPrimary: '#7f1d1d',
      textSecondary: '#991b1b',
      textMuted: '#b91c1c',
      accent: '#dc2626',
      accentHover: '#b91c1c',
      accentSecondary: '#ef4444',
      border: '#fca5a5',
      cardBg: '#ffffff',
      success: '#16a34a',
      warning: '#ca8a04',
      error: '#7f1d1d',
    },
    dark: {
      bgPrimary: '#18181b',
      bgSecondary: '#27272a',
      bgTertiary: '#3f3f46',
      textPrimary: '#fecaca',
      textSecondary: '#fca5a5',
      textMuted: '#f87171',
      accent: '#ef4444',
      accentHover: '#f87171',
      accentSecondary: '#fb7185',
      border: '#3f3f46',
      cardBg: '#27272a',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#fb7185',
    },
  },
  
  ocean: {
    name: 'Ocean',
    description: 'Teal and sea blue',
    icon: '🌊',
    light: {
      bgPrimary: '#f0f9ff',
      bgSecondary: '#e0f2fe',
      bgTertiary: '#bae6fd',
      textPrimary: '#0c4a6e',
      textSecondary: '#075985',
      textMuted: '#0369a1',
      accent: '#0891b2',
      accentHover: '#0e7490',
      accentSecondary: '#06b6d4',
      border: '#7dd3fc',
      cardBg: '#ffffff',
      success: '#10b981',
      warning: '#d97706',
      error: '#ef4444',
    },
    dark: {
      bgPrimary: '#082f49',
      bgSecondary: '#0c4a6e',
      bgTertiary: '#075985',
      textPrimary: '#e0f2fe',
      textSecondary: '#7dd3fc',
      textMuted: '#38bdf8',
      accent: '#06b6d4',
      accentHover: '#22d3ee',
      accentSecondary: '#67e8f9',
      border: '#075985',
      cardBg: '#0c4a6e',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  
  forest: {
    name: 'Forest',
    description: 'Nature greens',
    icon: '🌲',
    light: {
      bgPrimary: '#f0fdf4',
      bgSecondary: '#dcfce7',
      bgTertiary: '#bbf7d0',
      textPrimary: '#14532d',
      textSecondary: '#166534',
      textMuted: '#15803d',
      accent: '#059669',
      accentHover: '#047857',
      accentSecondary: '#10b981',
      border: '#86efac',
      cardBg: '#ffffff',
      success: '#16a34a',
      warning: '#a16207',
      error: '#dc2626',
    },
    dark: {
      bgPrimary: '#052e16',
      bgSecondary: '#14532d',
      bgTertiary: '#166534',
      textPrimary: '#dcfce7',
      textSecondary: '#86efac',
      textMuted: '#4ade80',
      accent: '#10b981',
      accentHover: '#34d399',
      accentSecondary: '#6ee7b7',
      border: '#166534',
      cardBg: '#14532d',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  
  sunset: {
    name: 'Sunset',
    description: 'Orange purple gradient',
    icon: '🌇',
    light: {
      bgPrimary: '#fff7ed',
      bgSecondary: '#ffedd5',
      bgTertiary: '#fed7aa',
      textPrimary: '#7c2d12',
      textSecondary: '#9a3412',
      textMuted: '#c2410c',
      accent: '#ea580c',
      accentHover: '#c2410c',
      accentSecondary: '#f97316',
      border: '#fdba74',
      cardBg: '#ffffff',
      success: '#16a34a',
      warning: '#ca8a04',
      error: '#dc2626',
    },
    dark: {
      bgPrimary: '#431407',
      bgSecondary: '#7c2d12',
      bgTertiary: '#9a3412',
      textPrimary: '#ffedd5',
      textSecondary: '#fdba74',
      textMuted: '#fb923c',
      accent: '#f97316',
      accentHover: '#fb923c',
      accentSecondary: '#fdba74',
      border: '#9a3412',
      cardBg: '#7c2d12',
      success: '#4ade80',
      warning: '#facc15',
      error: '#f87171',
    },
  },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  currentTheme: ColorThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY_MODE = 'pascal-theme-mode';
const STORAGE_KEY_THEME = 'pascal-color-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    const validThemes: ColorTheme[] = Object.keys(COLOR_THEMES) as ColorTheme[];
    if (saved && validThemes.includes(saved as ColorTheme)) {
      return saved as ColorTheme;
    }
    return 'indigo';
  });

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setThemeModeState(newMode);
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
    if (newMode === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  const setColorTheme = useCallback((newTheme: ColorTheme) => {
    setColorThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    // Remove all theme classes
    const validThemes: ColorTheme[] = Object.keys(COLOR_THEMES) as ColorTheme[];
    validThemes.forEach(theme => {
      document.documentElement.classList.remove(`theme-${theme}`);
    });
    document.documentElement.classList.add(`theme-${newTheme}`);
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  }, [themeMode, setThemeMode]);

  const currentTheme = COLOR_THEMES[colorTheme];

  // Apply theme on mount
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    const validThemes: ColorTheme[] = Object.keys(COLOR_THEMES) as ColorTheme[];
    validThemes.forEach(theme => {
      document.documentElement.classList.remove(`theme-${theme}`);
    });
    document.documentElement.classList.add(`theme-${colorTheme}`);
  }, [themeMode, colorTheme]);

  return (
    <ThemeContext.Provider value={{ 
      themeMode, 
      setThemeMode, 
      toggleThemeMode, 
      colorTheme, 
      setColorTheme,
      currentTheme 
    }}>
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
