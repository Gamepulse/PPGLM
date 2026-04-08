import type { ScanResult } from "../../types";
import { useI18n } from "../../i18n";

interface ResultActionsProps {
  matches: ScanResult[];
  onSave: () => void;
}

export function ResultActions({ matches, onSave }: ResultActionsProps) {
  const { t } = useI18n();

  return (
    <div className="pt-2 theme-border border-t">
      <p className="text-xs theme-text-muted mb-2">
        {t('onlyMatchedSaved').replace('{{count}}', String(matches.length))}
      </p>
      <button
        onClick={onSave}
        disabled={matches.length === 0}
        className={`w-full py-2 rounded-lg transition-colors ${
          matches.length === 0
            ? "bg-gray-600 theme-text-muted cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {t('addMatchedGames').replace('{{count}}', String(matches.length))}
      </button>
    </div>
  );
}
