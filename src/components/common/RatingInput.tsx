import { useI18n } from "../../i18n";

interface RatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  max?: number;
}

export function RatingInput({ value, onChange, disabled, max = 100 }: RatingInputProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs theme-text-muted">0</span>
      <input
        type="range"
        min="0"
        max={max}
        step="1"
        value={value ?? 0}
        disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
          disabled:cursor-not-allowed disabled:opacity-50
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:bg-indigo-500
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:hover:bg-indigo-400
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:bg-indigo-500
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:cursor-pointer
          [&::-moz-range-thumb]:border-0"
        aria-label={t('personalRating') || "Personal Rating"}
        title={`${value ?? 0}/${max}`}
      />
      <span className="text-xs theme-text-muted">{max}</span>
    </div>
  );
}
