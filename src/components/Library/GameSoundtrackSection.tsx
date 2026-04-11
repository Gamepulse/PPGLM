// Music/Soundtrack module - Disabled for future build
// This component displays and manages game soundtracks from VGMdb and MusicBrainz
// 
// To re-enable: Uncomment all code and ensure the useSoundtracks hook is functional

import type { Game } from '../../types';

interface GameSoundtrackSectionProps {
  game: Game;
}

// Placeholder component - music module disabled
export function GameSoundtrackSection({ game: _game }: GameSoundtrackSectionProps) {
  return null; // Render nothing when disabled
}

/*
Original implementation - commented out for future build

import { useState, useEffect } from 'react';
import { useSoundtracks } from '../../hooks/useSoundtracks';
import { SpotifyMiniPlayer } from './SpotifyMiniPlayer';
import { YouTubeMiniPlayer } from './YouTubeMiniPlayer';
import { useI18n } from '../../i18n';
import type { GameSoundtrack, MusicBrainzRelease, Game } from '../../types';

interface GameSoundtrackSectionProps {
  game: Game;
}

export function GameSoundtrackSection({ game }: GameSoundtrackSectionProps) {
  const { t } = useI18n();
  const {
    soundtracks,
    loading,
    error,
    musicbrainzResults,
    searchingMB,
    fetchSoundtracks,
    deleteSoundtrack,
    searchMusicBrainz,
    addMusicBrainzSoundtrack,
    setMusicbrainzResults,
  } = useSoundtracks();

  const [showMBSearch, setShowMBSearch] = useState(false);

  useEffect(() => {
    if (game.id) {
      fetchSoundtracks(game.id);
    }
  }, [game.id, fetchSoundtracks]);

  const handleMusicBrainzSearch = async () => {
    if (game.display_name) {
      await searchMusicBrainz(game.display_name);
      setShowMBSearch(true);
    }
  };

  const handleAddMusicBrainz = async (release: MusicBrainzRelease) => {
    if (game.id) {
      await addMusicBrainzSoundtrack(game.id, release);
      setMusicbrainzResults([]);
      setShowMBSearch(false);
    }
  };

  const handleDelete = async (soundtrackId: number) => {
    if (game.id) {
      await deleteSoundtrack(soundtrackId, game.id);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold theme-text-primary">
          {t('soundtracks') || 'Soundtracks'}
        </h3>
        <button
          onClick={handleMusicBrainzSearch}
          disabled={searchingMB}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-700 transition-colors"
        >
          {searchingMB ? '...' : (t('searchMusicBrainz') || 'Search MusicBrainz')}
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">{t('loading')}</p>}
      
      {error && <p className="text-sm text-red-400">{error}</p>}

      {soundtracks.length === 0 && !loading && (
        <p className="text-sm text-gray-500">
          {t('noSoundtracks') || 'No soundtracks found. Search MusicBrainz to add some.'}
        </p>
      )}

      {soundtracks.length > 0 && (
        <div className="space-y-3">
          {soundtracks.map((soundtrack) => (
            <div
              key={soundtrack.id}
              className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              {soundtrack.cover_url && (
                <img
                  src={soundtrack.cover_url}
                  alt={soundtrack.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium theme-text-primary truncate">
                  {soundtrack.title}
                </p>
                {soundtrack.artist && (
                  <p className="text-sm text-gray-400 truncate">
                    {soundtrack.artist}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(soundtrack.id)}
                  className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                  title={t('delete') || 'Delete'}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showMBSearch && musicbrainzResults.length > 0 && (
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium theme-text-primary">
              {t('musicBrainzResults') || 'MusicBrainz Results'}
            </h4>
            <button
              onClick={() => setShowMBSearch(false)}
              className="text-sm text-gray-400 hover:text-white"
            >
              {t('close') || 'Close'}
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {musicbrainzResults.map((release) => (
              <button
                key={release.id}
                onClick={() => handleAddMusicBrainz(release)}
                className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <p className="font-medium theme-text-primary">{release.title}</p>
                <p className="text-sm text-gray-400">
                  {release.artist_credit.map(a => a.name).join(', ')}
                  {release.date && ` · ${release.date}`}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
*/
