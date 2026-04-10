import { useTheme, COLOR_THEMES, ColorTheme } from "../../theme";

export function ThemeSelector() {
  const { themeMode, setThemeMode, toggleThemeMode, colorTheme, setColorTheme, currentTheme } = useTheme();

  const handleThemeModeChange = (newMode: 'light' | 'dark') => {
    setThemeMode(newMode);
  };

  const handleColorThemeChange = (newTheme: ColorTheme) => {
    setColorTheme(newTheme);
  };

  const getThemePreviewColors = (theme: ColorTheme) => {
    const config = COLOR_THEMES[theme];
    return themeMode === 'dark' 
      ? {
          bg: config.dark.bgSecondary,
          accent: config.dark.accent,
          text: config.dark.textPrimary
        }
      : {
          bg: config.light.bgSecondary,
          accent: config.light.accent,
          text: config.light.textPrimary
        };
  };

  return (
    <div className="space-y-8">
      {/* Theme Mode Selection */}
      <div>
        <h2 className="text-lg font-semibold mb-4 theme-text-primary">
          Mode
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleThemeModeChange('light')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              themeMode === 'light'
                ? 'theme-accent text-white'
                : 'theme-bg-tertiary theme-text-secondary hover:theme-text-primary'
            }`}
          >
            <span>☀️</span>
            <span>Light</span>
          </button>
          <button
            onClick={() => handleThemeModeChange('dark')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              themeMode === 'dark'
                ? 'theme-accent text-white'
                : 'theme-bg-tertiary theme-text-secondary hover:theme-text-primary'
            }`}
          >
            <span>🌙</span>
            <span>Dark</span>
          </button>
        </div>
        <p className="text-sm mt-2 theme-text-muted">
          Current: {themeMode === 'dark' ? 'Dark' : 'Light'}
        </p>
      </div>

      {/* Color Theme Selection */}
      <div>
        <h2 className="text-lg font-semibold mb-4 theme-text-primary">
          Color Theme
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {(Object.keys(COLOR_THEMES) as ColorTheme[]).map((theme) => {
            const isSelected = colorTheme === theme;
            const colors = getThemePreviewColors(theme);
            const config = COLOR_THEMES[theme];
            
            return (
              <button
                key={theme}
                onClick={() => handleColorThemeChange(theme)}
                className={`relative p-3 rounded-xl transition-all duration-200 text-left group ${
                  isSelected
                    ? 'ring-2 ring-offset-2'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: colors.bg,
                  borderColor: isSelected ? colors.accent : 'transparent',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  boxShadow: isSelected ? `0 0 0 2px ${colors.accent}40` : 'none'
                }}
              >
                {/* Preview Bar */}
                <div 
                  className="h-2 w-full rounded-full mb-2"
                  style={{ backgroundColor: colors.accent }}
                />
                
                {/* Icon & Name */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <div className="flex flex-col">
                    <span 
                      className="font-semibold text-sm"
                      style={{ color: colors.text }}
                    >
                      {config.name}
                    </span>
                    <span 
                      className="text-xs opacity-70"
                      style={{ color: colors.text }}
                    >
                      {config.description}
                    </span>
                  </div>
                </div>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div 
                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: colors.accent }}
                  >
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-sm mt-3 theme-text-muted">
          Current: {currentTheme.name} ({currentTheme.description})
        </p>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t theme-border">
        <button
          onClick={toggleThemeMode}
          className="px-4 py-2 theme-bg-tertiary theme-text-primary rounded-lg hover:opacity-80 transition-opacity text-sm"
        >
          Toggle {themeMode === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </div>
    </div>
  );
}
