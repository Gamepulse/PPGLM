import { useSettings } from "../../hooks/useSettings";
import { useI18n } from "../../i18n";

const FONT_SIZE_OPTIONS = [
  { value: 80, label: "Small", desc: "80%" },
  { value: 90, label: "Compact", desc: "90%" },
  { value: 100, label: "Default", desc: "100%" },
  { value: 110, label: "Large", desc: "110%" },
  { value: 125, label: "Extra Large", desc: "125%" },
  { value: 150, label: "Huge", desc: "150%" },
];

export function FontSizeSelector() {
  const { t } = useI18n();
  const { fontSize, setFontSize, loading } = useSettings();

  const getCurrentLabel = () => {
    const option = FONT_SIZE_OPTIONS.find(opt => opt.value === fontSize);
    return option ? option.label : "Custom";
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        {t('fontSize') || "Font Size"}
      </h2>
      
      <p className="text-gray-400 text-sm mb-4">
        {t('fontSizeDesc') || "Adjust the text size throughout the application. Changes apply immediately."}
      </p>

      <div className="space-y-3">
        {FONT_SIZE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setFontSize(option.value)}
            disabled={loading}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
              fontSize === option.value
                ? "bg-indigo-600/30 border-indigo-500 text-white"
                : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50"
            } disabled:opacity-50`}
          >
            <div className="flex items-center gap-3">
              <span 
                className="text-lg"
                style={{ fontSize: `${option.value}%` }}
              >
                Aa
              </span>
              <span className="font-medium">{option.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{option.desc}</span>
              {fontSize === option.value && (
                <span className="text-indigo-400 text-sm">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Preview text */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
          {t('preview') || "Preview"}
        </p>
        <p 
          className="text-gray-300"
          style={{ fontSize: `${fontSize}%` }}
        >
          {t('fontSizePreview') || "The quick brown fox jumps over the lazy dog. This is how text will appear throughout the application."}
        </p>
      </div>

      {/* Current size indicator */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {t('currentSize') || "Current size"}: <span className="text-indigo-400 font-medium">{getCurrentLabel()}</span>
        </span>
        <span className="text-gray-500">
          {fontSize}%
        </span>
      </div>
    </div>
  );
}
