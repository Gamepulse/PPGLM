import type { ScanProgress } from "../../types";
import { useI18n } from "../../i18n";
import { useSettings } from "../../hooks/useSettings";

interface ScanControlsProps {
  scanning: boolean;
  isStopping: boolean;
  hasFolders: boolean;
  resultCount: number;
  progress: ScanProgress | null;
  onScan: () => void;
  onStop: () => void;
  compact?: boolean; // Hide depth slider and use smaller button
}

export function ScanControls({
  scanning, isStopping, hasFolders, resultCount, progress, onScan, onStop, compact = false,
}: ScanControlsProps) {
  const { t } = useI18n();
  const { scanDepth, setScanDepth } = useSettings();

  return (
    <div>
      {/* Scan Depth Slider - Hidden in compact mode */}
      {!scanning && !compact && (
        <div className="mb-4 p-3 theme-bg-secondary rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium theme-text-secondary">
              {t('scanDepth') || 'Scan Depth'}
            </label>
            <span className="text-sm font-mono theme-text-primary font-semibold">{scanDepth}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs theme-text-muted w-8">1</span>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={scanDepth}
              onChange={(e) => setScanDepth(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs theme-text-muted w-6">10</span>
          </div>
          <p className="text-xs theme-text-muted mt-1">
            {scanDepth === 1
              ? (t('scanDepthShallow') || 'Scan only root-level folders')
              : scanDepth <= 3
                ? (t('scanDepthDefault') || 'Default depth — recommended for most libraries')
                : (t('scanDepthDeep') || 'Deep scan — useful for nested folder structures')
            }
          </p>
        </div>
      )}

      {/* Scan / Stop Button */}
      <div className="flex gap-2">
        <button
          onClick={onScan}
          disabled={!hasFolders || scanning}
          className={`flex-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold relative overflow-hidden ${compact ? 'py-1.5 text-sm' : 'py-3'}`}
        >
          {scanning && !isStopping && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x" />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {scanning ? (
              isStopping ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('stopping')}
                </>
              ) : (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('scanningSmart')} {progress && `(${progress.folders_scanned} ${t('foldersChecked')}, ${resultCount} ${t('gamesFound')})`}
                </>
              )
            ) : (
              t('scanAllFolders')
            )}
          </span>
        </button>

        {scanning && (
          <button
            onClick={onStop}
            disabled={isStopping}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isStopping ? t('stopping') : t('stop')}
          </button>
        )}
      </div>

      {/* Animation Under Button */}
      {scanning && (
        <div className="space-y-2 mt-2">
          <div className="relative h-2 theme-bg-tertiary rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-shimmer"
              style={{ width: "60%", animation: "shimmer 2s infinite linear" }}
            />
          </div>
          {progress?.current_path && (
            <p className="text-xs theme-text-muted font-mono truncate animate-pulse">
              → {progress.current_path}
            </p>
          )}
        </div>
      )}

      {/* Real-time Results Counter */}
      {scanning && resultCount > 0 && (
        <div className="text-sm theme-text-muted mt-2">
          {t('gamesFound')} <span className="theme-text-primary font-semibold">{resultCount}</span> {t('potentialGamesFound')}
        </div>
      )}
    </div>
  );
}
