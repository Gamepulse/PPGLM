import { useTheme } from "../../theme";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Theme
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
  );
}
