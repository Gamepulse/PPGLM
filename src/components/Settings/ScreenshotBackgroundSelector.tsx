import { useSettings } from "../../hooks/useSettings";
import { useI18n } from "../../i18n";

export function ScreenshotBackgroundSelector() {
  const { screenshotBgCount, setScreenshotBgCount, loading } = useSettings();
  const { t } = useI18n();

  const options = [
    { value: 0, label: t('screenshotBgDisabled') || "Disabled", desc: t('screenshotBgDisabledDesc') || "No screenshots as background" },
    { value: 1, label: "1 " + (t('screenshot') || "Screenshot"), desc: t('screenshotBg1Desc') || "Single screenshot as background" },
    { value: 2, label: "2 " + (t('screenshots') || "Screenshots"), desc: t('screenshotBg2Desc') || "2 screenshots in rotation" },
    { value: 3, label: "3 " + (t('screenshots') || "Screenshots"), desc: t('screenshotBg3Desc') || "3 screenshots in rotation" },
    { value: 4, label: "4 " + (t('screenshots') || "Screenshots"), desc: t('screenshotBg4Desc') || "4 screenshots in rotation" },
    { value: 5, label: "5 " + (t('screenshots') || "Screenshots"), desc: t('screenshotBg5Desc') || "5 screenshots in rotation" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        {t('screenshotBackground') || "Game Detail Background"}
      </h2>
      
      <div className="space-y-4">
        <p className="text-gray-400 text-sm leading-relaxed">
          {t('screenshotBackgroundDesc') || "Display screenshots as a background slideshow on the game detail page. This adds visual appeal to your game library."}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setScreenshotBgCount(option.value)}
              disabled={loading}
              className={`p-3 rounded-lg border text-left transition-colors ${
                screenshotBgCount === option.value
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className={`text-xs mt-1 ${screenshotBgCount === option.value ? "text-indigo-200" : "text-gray-500"}`}>
                {option.desc}
              </div>
            </button>
          ))}
        </div>

        {screenshotBgCount > 0 && (
          <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-3 text-sm">
            <p className="text-indigo-300">
              <span className="font-semibold">{t('screenshotBgPreview') || "Preview:"}</span>{" "}
              {t('screenshotBgActive') || `The game detail page will show up to ${screenshotBgCount} screenshot${screenshotBgCount > 1 ? 's' : ''} rotating in the background.`}
            </p>
          </div>
        )}
        
        <p className="text-xs text-gray-500 italic">
          {t('screenshotBgTip') || "Tip: Add screenshots to your games using the Screenshot feature in game details."}
        </p>
      </div>
    </div>
  );
}
