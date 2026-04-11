import { useState } from "react";
import type { ScanResult, MatchCandidate } from "../../types";
import { useI18n } from "../../i18n";
import { getBadgeColor } from "../../utils/colors";
import { PlatformSelector } from "./PlatformSelector";

interface ResultCardProps {
  result: ScanResult;
  isNonMatch: boolean;
  isEditing: boolean;
  isRetrying?: boolean;
  isExcluded?: boolean;
  isRejected?: boolean;
  isParent?: boolean;
  onUpdateDisplayName: (folderPath: string, newName: string) => void;
  onSelectCandidate: (folderPath: string, candidate: MatchCandidate) => void;
  onConfirmNonMatch: (folderPath: string) => void;
  onDelete: (folderPath: string) => void;
  onCreateExclusion: (folderName: string) => void;
  onSetEditing: (path: string | null) => void;
  onOpenIgdb: (igdbId: number, igdbSlug?: string | null) => void;
  onUpdatePlatform?: (folderPath: string, platform: string | null) => void;
  onRetrySearch?: (folderPath: string, folderName: string, modifiedName: string) => void;
  onToggleExclusion?: (folderPath: string) => void;
  onPromote?: (folderPath: string) => void;
}

export function ResultCard({
  result, isNonMatch, isEditing, isRetrying, isExcluded, isRejected, isParent,
  onUpdateDisplayName, onSelectCandidate, onConfirmNonMatch,
  onDelete, onCreateExclusion, onSetEditing, onOpenIgdb,
  onUpdatePlatform, onRetrySearch, onToggleExclusion, onPromote,
}: ResultCardProps) {
  const { t } = useI18n();
  const [isCandidatesExpanded, setIsCandidatesExpanded] = useState(false);
  const [candidateOffset, setCandidateOffset] = useState(1); // Start after first candidate (index 1)

  // Track if name has been modified during editing
  const [hasNameChanged, setHasNameChanged] = useState(false);
  
  // Handle edit completion - trigger re-search automatically
  const handleEditComplete = () => {
    onSetEditing(null);
    setHasNameChanged(false);
    // Automatically trigger re-search when editing is done
    if (onRetrySearch && !isRetrying) {
      onRetrySearch(result.folder_path, result.folder_name, result.display_name);
    }
  };

  // Handle key press in edit mode
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleEditComplete();
    } else if (e.key === "Escape") {
      // Cancel editing without triggering search
      onSetEditing(null);
      setHasNameChanged(false);
    }
  };

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDisplayName(result.folder_path, e.target.value);
    setHasNameChanged(true);
  };

  // Determine card style based on type
  const getCardStyle = () => {
    if (isRejected) return "bg-orange-900/20 border-orange-700/50";
    if (isParent) return "bg-purple-900/20 border-purple-700/50";
    if (isExcluded) return "bg-yellow-900/20 border-yellow-700/50";
    if (isNonMatch) return "theme-bg-secondary border-gray-700";
    return "theme-bg-tertiary border-gray-600";
  };

  return (
    <div className={`p-3 rounded-lg theme-border border ${getCardStyle()}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          {result.cover_url ? (
            <img src={result.cover_url} alt={result.display_name}
              className="w-16 h-20 object-cover rounded shadow-md"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-16 h-20 bg-gray-700 rounded flex items-center justify-center theme-text-muted text-xl">🎮</div>
          )}
          {/* IGDB Link under thumbnail */}
          {result.igdb_id && (
            <button 
              onClick={() => onOpenIgdb(result.igdb_id!, result.igdb_slug)} 
              title={t('viewOnIgdb')}
              className="text-blue-400 hover:text-blue-300 text-xs px-2 py-0.5 bg-blue-900/30 rounded hover:bg-blue-900/50 transition-colors w-full text-center"
            >
              IGDB ↗
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            {/* Left side: Text and inline controls */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input 
                      type="text" 
                      value={result.display_name}
                      onChange={handleNameChange}
                      onBlur={handleEditComplete}
                      onKeyDown={handleKeyDown}
                      className="flex-1 px-2 py-1 bg-gray-700 theme-text-primary rounded theme-border border focus:border-blue-500 focus:outline-none"
                      autoFocus 
                    />
                    {/* Re-search button next to text when editing */}
                    {hasNameChanged && onRetrySearch && (
                      <button 
                        onClick={() => onRetrySearch(result.folder_path, result.folder_name, result.display_name)}
                        disabled={isRetrying}
                        title={t('retrySearch') || "Re-search IGDB"}
                        className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded transition-colors whitespace-nowrap"
                      >
                        {isRetrying ? "..." : (t('reSearch') || "↻")}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="theme-text-primary font-medium cursor-pointer hover:text-blue-400"
                      onClick={() => onSetEditing(result.folder_path)} title={t('clickToEdit')}>
                      {result.display_name}
                    </p>
                    <span className="theme-text-muted text-xs">({result.folder_name})</span>
                    {/* Re-search button next to text (always visible when not editing) */}
                    {onRetrySearch && (
                      <button 
                        onClick={() => onRetrySearch(result.folder_path, result.folder_name, result.display_name)}
                        disabled={isRetrying}
                        title={t('retrySearch') || "Re-search IGDB"}
                        className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded transition-colors whitespace-nowrap"
                      >
                        {isRetrying ? "..." : (t('reSearch') || "↻")}
                      </button>
                    )}
                  </>
                )}
              </div>
              
              {/* Folder path */}
              <p className="theme-text-muted text-xs truncate mt-1">{result.folder_path}</p>
              
              {/* Platform selector - inline next to text */}
              {(result.match_confidence === "Exact" || result.match_confidence === "Fuzzy") && onUpdatePlatform && (
                <div className="mt-2">
                  <PlatformSelector
                    currentPlatform={result.platform}
                    onSelect={(platform) => onUpdatePlatform(result.folder_path, platform)}
                    size="sm"
                  />
                </div>
              )}
            </div>
            
            {/* Right side: Action buttons - Fuzzy/Exact first */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Badge - FIRST on the right */}
              <span className={`px-2 py-1 text-xs rounded-full ${getBadgeColor(result.match_confidence)} text-white whitespace-nowrap`}>
                {isRejected ? t('rejected') || "Rejected" : isParent ? t('parent') || "Parent" : result.match_confidence === "None" ? t('noMatch') : result.match_confidence}
              </span>
              
              {/* Promote button for rejected or parent matches */}
              {(isRejected || isParent) && onPromote && (
                <button 
                  onClick={() => onPromote(result.folder_path)}
                  title={isRejected ? t('acceptRejected') || "Accept this match" : t('acceptParent') || "Accept as game"}
                  className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors whitespace-nowrap"
                >
                  ✓ {t('accept') || "Accept"}
                </button>
              )}
              
              {/* Permanent exclusion button */}
              <button 
                onClick={() => {
                  if (confirm(t('confirmExclusion').replace('{{name}}', result.folder_name))) onCreateExclusion(result.folder_name);
                }} 
                title={t('addToExclusionPatterns')}
                className="text-gray-500 hover:text-red-400 p-1 transition-colors text-xs"
              >
                🚫
              </button>
                
              {/* Remove from results */}
              <button 
                onClick={() => onDelete(result.folder_path)} 
                title={t('removeFromResults')}
                className="theme-text-muted hover:text-red-400 p-1 transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>

          {result.candidates.length > 0 && (
            <div className="mt-2">
              <p className="text-xs theme-text-muted mb-1">
                {result.match_confidence === "None" ? t('possibleMatches') : t('otherCandidates')}
                <span className="ml-1 text-gray-500">({result.candidates.length})</span>
              </p>
              
              {/* Show first candidate always */}
              {result.candidates[0] && (
                <button
                  onClick={() => onSelectCandidate(result.folder_path, result.candidates[0])}
                  className={`flex items-center gap-2 text-xs pl-2 py-1 rounded w-full text-left transition-colors ${
                    result.candidates[0].id === result.igdb_id ? "bg-green-900 text-green-200" : "theme-text-secondary hover:bg-gray-700"
                  }`}>
                  {result.candidates[0].cover_url ? (
                    <img src={result.candidates[0].cover_url} alt="" className="w-6 h-8 object-cover rounded flex-shrink-0" />
                  ) : (
                    <span className="w-6 h-8 bg-gray-700 rounded flex items-center justify-center text-[10px] flex-shrink-0">🎮</span>
                  )}
                  <span className="truncate">
                    {result.candidates[0].name} ({t('distance')}: {result.candidates[0].distance}){result.candidates[0].id === result.igdb_id && " ✓"}
                  </span>
                </button>
              )}
              
              {/* Show remaining candidates only when expanded - paginated by 10 */}
              {isCandidatesExpanded && (
                <>
                  {/* Show candidates from current offset, max 10 */}
                  {result.candidates.slice(candidateOffset, candidateOffset + 10).map((candidate) => (
                    <button key={candidate.id}
                      onClick={() => onSelectCandidate(result.folder_path, candidate)}
                      className={`flex items-center gap-2 text-xs pl-2 py-1 rounded w-full text-left transition-colors mt-1 ${
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
                  
                  {/* Pagination entry: Show 10 more or Previous */}
                  <div className="flex gap-1 mt-1">
                    {/* Previous button (if not at start) */}
                    {candidateOffset > 1 && (
                      <button
                        onClick={() => setCandidateOffset(Math.max(1, candidateOffset - 10))}
                        className="flex-1 py-1.5 text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded transition-colors"
                      >
                        ← {t('showPrevious') || 'Previous'} ({Math.min(10, candidateOffset - 1)})
                      </button>
                    )}
                    
                    {/* Next button (if more candidates) */}
                    {candidateOffset + 10 < result.candidates.length && (
                      <button
                        onClick={() => setCandidateOffset(candidateOffset + 10)}
                        className="flex-1 py-1.5 text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded transition-colors"
                      >
                        {t('showMore') || 'Show 10 more'} ({result.candidates.length - candidateOffset - 10} {t('remaining') || 'remaining'}) →
                      </button>
                    )}
                  </div>
                </>
              )}
              
              {/* Big arrow toggle button - points UP when expanded (to close), DOWN when collapsed (to open) */}
              {result.candidates.length > 1 && (
                <button
                  onClick={() => {
                    if (isCandidatesExpanded) {
                      setIsCandidatesExpanded(false);
                      setCandidateOffset(1); // Reset to start when closing
                    } else {
                      setIsCandidatesExpanded(true);
                    }
                  }}
                  className="mt-2 py-1.5 px-4 mx-auto flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-colors w-auto"
                  title={isCandidatesExpanded ? "Close" : "Show candidates"}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`w-6 h-6 transform transition-transform duration-200 ${isCandidatesExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {/* When expanded (isCandidatesExpanded=true), arrow points UP (user wants it pointing UP when menu is open) */}
                    {/* When collapsed, arrow points DOWN */}
                    <path strokeLinecap="round" strokeLinejoin="round" d={isCandidatesExpanded ? "M19 9l-7 7-7-7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>
              )}
            </div>
          )}

          {(result.match_confidence === "Exact" || result.match_confidence === "Fuzzy") && result.igdb_id && (
            <div className="mt-2 text-xs text-green-400">✓ {t('matchedWithIgdb')} {result.igdb_id}</div>
          )}

          {result.match_confidence === "None" && !isRejected && !isParent && (
            <button onClick={() => onConfirmNonMatch(result.folder_path)}
              className="mt-2 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
              {t('confirmAsMatch')}
            </button>
          )}
          
          {/* Show info for rejected matches */}
          {isRejected && result.candidates.length > 0 && (
            <div className="mt-2 text-xs text-orange-300">
              {t('bestCandidate') || "Best candidate"}: {result.candidates[0].name} ({t('distance')}: {result.candidates[0].distance})
            </div>
          )}
          
          {/* Show info for parent folders */}
          {isParent && (
            <div className="mt-2 text-xs text-purple-300">
              {t('parentFolderInfo') || "This folder was scanned but had no direct match. It may contain subfolders with games."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
