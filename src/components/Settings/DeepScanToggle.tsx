import { useSettings } from "../../hooks/useSettings";
import { useI18n } from "../../i18n";

export function DeepScanToggle() {
  const { continueScanAfterMatch, setContinueScanAfterMatch, loading } = useSettings();
  const { t } = useI18n();

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        {t('deepScan') || "Deep Scan"}
      </h2>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            id="deep-scan-toggle"
            name="deep-scan-toggle"
            type="checkbox"
            checked={continueScanAfterMatch}
            onChange={(e) => setContinueScanAfterMatch(e.target.checked)}
            disabled={loading}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-white">
            {t('continueScanAfterMatch') || "Continue scanning after match"}
          </span>
        </label>
      </div>
      <p className="text-gray-400 text-sm mt-2">
        {t('deepScanDescription') || 
          "When enabled, the scanner will continue scanning subdirectories even after finding a game match. " +
          "This is useful for detecting multiple games in nested folders, but may take longer."}
      </p>
    </div>
  );
}
