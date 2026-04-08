import { useI18n } from "../../i18n";

interface IgdbNotConfiguredProps {
  onNavigate?: (view: string) => void;
}

export function IgdbNotConfigured({ onNavigate }: IgdbNotConfiguredProps) {
  const { t } = useI18n();

  return (
    <div className="p-6 theme-bg-secondary rounded-lg">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="text-lg font-semibold theme-text-primary">{t('igdbNotConfigured')}</h3>
          <p className="theme-text-muted text-sm mt-1">{t('igdbNotConfiguredDesc')}</p>
        </div>
      </div>
      <button onClick={() => onNavigate?.("settings")}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
        {t('openSettings')}
      </button>
    </div>
  );
}
