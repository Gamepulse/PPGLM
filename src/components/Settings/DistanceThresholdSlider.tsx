import { useSettings } from "../../hooks/useSettings";
import { useI18n } from "../../i18n";

export function DistanceThresholdSlider() {
  const { matchThreshold, setMatchThreshold, loading } = useSettings();
  const { t } = useI18n();

  const getRecommendation = (value: number): string => {
    if (value <= 5) return t('thresholdStrict') || "Strict - Only exact matches";
    if (value <= 10) return t('thresholdBalanced') || "Balanced - Good accuracy";
    if (value <= 15) return t('thresholdRelaxed') || "Relaxed - Better for long titles";
    if (value <= 25) return t('thresholdLoose') || "Loose - May have false positives";
    return t('thresholdVeryLoose') || "Very Loose - Maximum coverage";
  };

  const getDescription = (value: number): string => {
    if (value <= 5) {
      return t('thresholdStrictDesc') || 
        "Only accepts very close matches. Best for well-organized libraries with clean folder names. May miss games with long subtitles.";
    }
    if (value <= 10) {
      return t('thresholdBalancedDesc') || 
        "Good balance between accuracy and flexibility. Recommended for most users.";
    }
    if (value <= 15) {
      return t('thresholdRelaxedDesc') || 
        "Allows for longer subtitles and variations. Good for games like 'Assassin's Creed' or 'Crash Bandicoot 4: It's About Time'.";
    }
    if (value <= 25) {
      return t('thresholdLooseDesc') || 
        "Very permissive. May match incorrect games but catches almost everything. Check results carefully.";
    }
    return t('thresholdVeryLooseDesc') || 
      "Maximum permissiveness. Catches almost all games including those with very different folder names. Will likely have many false positives that need manual review.";
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        {t('matchThreshold') || "Match Threshold"}
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            id="match-threshold"
            name="match-threshold"
            type="range"
            min="5"
            max="50"
            step="1"
            value={matchThreshold}
            onChange={(e) => setMatchThreshold(parseInt(e.target.value))}
            disabled={loading}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-white font-mono text-lg min-w-[3rem] text-center">
            {matchThreshold}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-indigo-400">
            {getRecommendation(matchThreshold)}
          </span>
        </div>
        
        <p className="text-gray-400 text-sm leading-relaxed">
          {getDescription(matchThreshold)}
        </p>
        
        <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-400 mb-2">{t('thresholdExamples') || "Examples:"}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-indigo-400">5-10:</span> "Elden Ring", "Hades"
            </div>
            <div>
              <span className="text-indigo-400">10-15:</span> "Assassin's Creed II", "Crash Bandicoot 4"
            </div>
            <div>
              <span className="text-indigo-400">15-25:</span> "The Legend of Zelda: Breath of the Wild"
            </div>
            <div>
              <span className="text-indigo-400">25-50:</span> "Extremely long titles, repack names, or badly named folders"
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 italic">
          {t('thresholdTip') || "Tip: If a game isn't being detected, try increasing this value slightly and scan again."}
        </p>
      </div>
    </div>
  );
}
