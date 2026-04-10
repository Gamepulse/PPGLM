import { useTheme, SKIN_CONFIGS, ColorSkin } from "../../theme";

export function ThemeSelector() {
  const { theme, setTheme, colorSkin, setColorSkin } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const handleSkinChange = (newSkin: ColorSkin) => {
    setColorSkin(newSkin);
  };

  const getSkinButtonClass = (skin: ColorSkin) => {
    const isSelected = colorSkin === skin;
    const baseClass = "px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium";
    
    if (isSelected) {
      // Selected state with skin-specific colors
      const colorClasses: Record<ColorSkin, string> = {
        indigo: 'bg-indigo-600 text-white',
        emerald: 'bg-emerald-600 text-white',
        rose: 'bg-rose-600 text-white',
        amber: 'bg-amber-600 text-white',
        cyan: 'bg-cyan-600 text-white',
        violet: 'bg-violet-600 text-white',
      };
      return `${baseClass} ${colorClasses[skin]}`;
    } else {
      // Unselected state
      return `${baseClass} bg-gray-700 text-gray-300 hover:bg-gray-600`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme Mode Selection */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Theme Mode
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleThemeChange('light')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              theme === 'light'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span>☀️</span>
            <span>Light</span>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              theme === 'dark'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span>🌙</span>
            <span>Dark</span>
          </button>
        </div>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Current: {theme}
        </p>
      </div>

      {/* Color Skin Selection */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Color Theme
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SKIN_CONFIGS) as ColorSkin[]).map((skin) => (
            <button
              key={skin}
              onClick={() => handleSkinChange(skin)}
              className={getSkinButtonClass(skin)}
            >
              <span>{SKIN_CONFIGS[skin].icon}</span>
              <span>{SKIN_CONFIGS[skin].name}</span>
            </button>
          ))}
        </div>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Current: {SKIN_CONFIGS[colorSkin].name}
        </p>
      </div>
    </div>
  );
}
