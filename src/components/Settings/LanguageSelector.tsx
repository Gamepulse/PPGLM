import { useI18n } from "../../i18n";

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();

  const handleLanguageChange = (lang: 'en' | 'fr') => {
    setLanguage(lang);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {t('language')}
      </h2>
      <div className="flex gap-2">
        <button
          onClick={() => handleLanguageChange('en')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            language === 'en'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {t('english')}
        </button>
        <button
          onClick={() => handleLanguageChange('fr')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            language === 'fr'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {t('french')}
        </button>
      </div>
      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
        Current: {language}
      </p>
    </div>
  );
}
