import { useSettings } from "../../hooks/useSettings";
import { useI18n } from "../../i18n";

const MIN_FONT_SIZE = 80;
const MAX_FONT_SIZE = 150;
const STEP = 5;

export function FontSizeSelector() {
  const { t } = useI18n();
  const { fontSize, setFontSize, loading } = useSettings();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setFontSize(value);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        {t('fontSize') || "Font Size"}
      </h2>
      
      <p className="text-gray-400 text-sm mb-6">
        {t('fontSizeDesc') || "Adjust the text size throughout the application. Changes apply immediately."}
      </p>

      <div className="space-y-6">
        {/* Slider */}
        <div className="relative">
          <input
            type="range"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            step={STEP}
            value={fontSize}
            onChange={handleSliderChange}
            disabled={loading}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50
              [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:w-5 
              [&::-webkit-slider-thumb]:h-5 
              [&::-webkit-slider-thumb]:bg-indigo-500 
              [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:bg-indigo-400
              [&::-moz-range-thumb]:w-5 
              [&::-moz-range-thumb]:h-5 
              [&::-moz-range-thumb]:bg-indigo-500 
              [&::-moz-range-thumb]:rounded-full 
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:border-0"
          />
          
          {/* Scale markers */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{MIN_FONT_SIZE}%</span>
            <span>100%</span>
            <span>{MAX_FONT_SIZE}%</span>
          </div>
        </div>

        {/* Current size indicator */}
        <div className="flex items-center justify-center">
          <div className="bg-indigo-600/30 border border-indigo-500 rounded-lg px-4 py-2">
            <span className="text-indigo-400 font-semibold">{fontSize}%</span>
          </div>
        </div>
      </div>

      {/* Preview text */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
          {t('preview') || "Preview"}
        </p>
        <p className="text-gray-300">
          {t('fontSizePreview') || "The quick brown fox jumps over the lazy dog. This is how text will appear throughout the application."}
        </p>
      </div>
    </div>
  );
}
