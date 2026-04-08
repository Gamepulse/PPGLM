import type { ScanResult, MatchCandidate } from "../../types";
import { useI18n } from "../../i18n";
import { getBadgeColor } from "../../utils/colors";

interface ResultCardProps {
  result: ScanResult;
  isNonMatch: boolean;
  isEditing: boolean;
  onUpdateDisplayName: (folderPath: string, newName: string) => void;
  onSelectCandidate: (folderPath: string, candidate: MatchCandidate) => void;
  onConfirmNonMatch: (folderPath: string) => void;
  onDelete: (folderPath: string) => void;
  onCreateExclusion: (folderName: string) => void;
  onSetEditing: (path: string | null) => void;
  onOpenIgdb: (igdbId: number, igdbSlug?: string | null) => void;
}

export function ResultCard({
  result, isNonMatch, isEditing,
  onUpdateDisplayName, onSelectCandidate, onConfirmNonMatch,
  onDelete, onCreateExclusion, onSetEditing, onOpenIgdb,
}: ResultCardProps) {
  const { t } = useI18n();

  return (
    <div className={`p-3 rounded-lg theme-border border ${
      isNonMatch ? "theme-bg-secondary border-gray-700" : "theme-bg-tertiary border-gray-600"
    }`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {result.cover_url ? (
            <img src={result.cover_url} alt={result.display_name}
              className="w-16 h-20 object-cover rounded shadow-md"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-16 h-20 bg-gray-700 rounded flex items-center justify-center theme-text-muted text-xl">🎮</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input type="text" value={result.display_name}
                  onChange={(e) => onUpdateDisplayName(result.folder_path, e.target.value)}
                  onBlur={() => onSetEditing(null)}
                  onKeyDown={(e) => { if (e.key === "Enter") onSetEditing(null); }}
                  className="w-full px-2 py-1 bg-gray-700 theme-text-primary rounded theme-border border focus:border-blue-500 focus:outline-none"
                  autoFocus />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="theme-text-primary font-medium cursor-pointer hover:text-blue-400"
                    onClick={() => onSetEditing(result.folder_path)} title={t('clickToEdit')}>
                    {result.display_name}
                  </p>
                  <span className="theme-text-muted text-xs">({result.folder_name})</span>
                </div>
              )}
              <p className="theme-text-muted text-xs truncate">{result.folder_path}</p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {result.igdb_id && (
                <button onClick={() => onOpenIgdb(result.igdb_id!, result.igdb_slug)} title={t('viewOnIgdb')}
                  className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-blue-900/30 rounded hover:bg-blue-900/50 transition-colors">
                  IGDB ↗
                </button>
              )}
              <span className={`px-2 py-1 text-xs rounded-full ${getBadgeColor(result.match_confidence)} text-white whitespace-nowrap`}>
                {result.match_confidence === "None" ? t('noMatch') : result.match_confidence}
              </span>
              <button onClick={() => {
                if (confirm(t('confirmExclusion').replace('{{name}}', result.folder_name))) onCreateExclusion(result.folder_name);
              }} title={t('addToExclusionPatterns')}
                className="text-yellow-500 hover:text-yellow-400 p-1 transition-colors">🚫</button>
              <button onClick={() => onDelete(result.folder_path)} title={t('removeFromResults')}
                className="theme-text-muted hover:text-red-400 p-1 transition-colors">✕</button>
            </div>
          </div>

          {result.candidates.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs theme-text-muted">
                {result.match_confidence === "None" ? t('possibleMatches') : t('otherCandidates')}
              </p>
              {result.candidates.map((candidate) => (
                <button key={candidate.id}
                  onClick={() => onSelectCandidate(result.folder_path, candidate)}
                  className={`flex items-center gap-2 text-xs pl-2 py-1 rounded w-full text-left transition-colors ${
                    candidate.id === result.igdb_id ? "bg-green-900 text-green-200" : "theme-text-secondary hover:bg-gray-700"
                  }`}>
                  {candidate.cover_url ? (
                    <img src={candidate.cover_url} alt="" className="w-6 h-8 object-cover rounded flex-shrink-0" />
                  ) : (
                    <span className="w-6 h-8 bg-gray-700 rounded flex items-center justify-center text-[10px] flex-shrink-0">🎮</span>
                  )}
                  <span className="truncate">
                    {candidate.name} ({t('distance')}: {candidate.distance}){candidate.id === result.igdb_id && " ✓"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {(result.match_confidence === "Exact" || result.match_confidence === "Fuzzy") && result.igdb_id && (
            <div className="mt-2 text-xs text-green-400">✓ {t('matchedWithIgdb')} {result.igdb_id}</div>
          )}

          {result.match_confidence === "None" && (
            <button onClick={() => onConfirmNonMatch(result.folder_path)}
              className="mt-2 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
              {t('confirmAsMatch')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
