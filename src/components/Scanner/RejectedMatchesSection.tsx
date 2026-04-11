import { useState } from "react";
import type { RejectedMatchEvent } from "../../types";
import { useI18n } from "../../i18n";

interface RejectedMatchesSectionProps {
  rejectedMatches: RejectedMatchEvent[];
  compact?: boolean;
}

export function RejectedMatchesSection({ rejectedMatches, compact = false }: RejectedMatchesSectionProps) {
  const { t } = useI18n();
  const [showRejected, setShowRejected] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  return (
    <div className={`theme-border border-t border-red-600/30 ${compact ? 'space-y-2 pt-2' : 'space-y-4 pt-4'}`}>
      <button
        onClick={() => setShowRejected(!showRejected)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-red-500">⚠</span>
          <h3 className={`font-semibold theme-text-primary ${compact ? 'text-base' : 'text-lg'}`}>
            {t('rejectedMatches') || "Rejected Matches"} 
            <span className="text-sm font-normal theme-text-muted ml-2">
              ({rejectedMatches.length} {rejectedMatches.length === 1 ? 'folder' : 'folders'})
            </span>
          </h3>
        </div>
        <span className="theme-text-muted">{showRejected ? '▼' : '▶'}</span>
      </button>
      
      {showRejected && (
        <div className={`space-y-2 ${compact ? 'max-h-32' : 'max-h-80'} overflow-y-auto`}>
          {rejectedMatches.map((match, index) => (
            <div 
              key={index} 
              className="p-2 bg-red-900/20 rounded-lg border border-red-700/30"
            >
              <div className="flex items-start gap-2">
                <span className="text-red-500 text-sm">⚠</span>
                <div className="flex-1 min-w-0">
                  <p className="theme-text-primary text-sm font-medium truncate">{match.folder_name}</p>
                  <p className="theme-text-muted text-xs truncate">{match.folder_path}</p>
                  <p className="text-red-400 text-xs mt-1">
                    {t('bestCandidate') || "Best candidate"}: <span className="font-medium">{match.best_candidate_name}</span>
                    <span className="ml-2 text-red-300">
                      ({t('distance')}: {match.best_distance} / {t('threshold')}: {match.threshold})
                    </span>
                  </p>
                  
                  {/* Show other candidates if expanded */}
                  {match.candidates.length > 1 && (
                    <button
                      onClick={() => setExpandedMatch(expandedMatch === index ? null : index)}
                      className="text-xs text-red-400 hover:text-red-300 mt-1 underline"
                    >
                      {expandedMatch === index 
                        ? (t('hideOtherCandidates') || "Hide other candidates") 
                        : (t('showOtherCandidates') || `Show ${match.candidates.length - 1} other candidates`)
                      }
                    </button>
                  )}
                  
                  {expandedMatch === index && match.candidates.length > 1 && (
                    <div className="mt-2 space-y-1 pl-2 border-l-2 border-red-700/30">
                      {match.candidates.slice(1).map((candidate, cidx) => (
                        <div key={cidx} className="text-xs">
                          <span className="theme-text-secondary">{candidate.name}</span>
                          <span className="text-red-500 ml-2">({t('distance')}: {candidate.distance})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs theme-text-muted">
        {t('rejectedMatchesHelp') || "These folders found IGDB results but the match was too far from the threshold. Try lowering the match threshold in Settings or manually edit the folder name to retry."}
      </p>
    </div>
  );
}
