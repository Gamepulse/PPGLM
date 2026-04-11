import { useState } from 'react';
import { useI18n } from '../../i18n';

interface SpotifyMiniPlayerProps {
  spotifyUri?: string | null;
  spotifyUrl?: string | null;
  albumTitle?: string | null;
  compact?: boolean;
}

export function SpotifyMiniPlayer({ 
  spotifyUri, 
  spotifyUrl, 
  albumTitle,
  compact = false 
}: SpotifyMiniPlayerProps) {
  const { t } = useI18n();
  const [showEmbed, setShowEmbed] = useState(false);

  // Convert Spotify URI to embed URL
  const getEmbedUrl = (uri: string): string | null => {
    // Handle different Spotify URI formats
    // spotify:album:123456 -> https://open.spotify.com/embed/album/123456
    // spotify:track:123456 -> https://open.spotify.com/embed/track/123456
    // spotify:playlist:123456 -> https://open.spotify.com/embed/playlist/123456
    
    if (uri.startsWith('spotify:')) {
      const parts = uri.split(':');
      if (parts.length >= 3) {
        const type = parts[1];
        const id = parts[2];
        return `https://open.spotify.com/embed/${type}/${id}`;
      }
    }
    
    // If it's already a URL, convert it
    if (uri.includes('open.spotify.com')) {
      return uri.replace('open.spotify.com', 'open.spotify.com/embed');
    }
    
    return null;
  };

  // Extract embed URL from spotifyUrl if spotifyUri is not available
  const getEmbedUrlFromWebUrl = (url: string): string | null => {
    if (url.includes('open.spotify.com')) {
      // Convert web URL to embed URL
      // https://open.spotify.com/album/123456 -> https://open.spotify.com/embed/album/123456
      return url.replace('open.spotify.com', 'open.spotify.com/embed');
    }
    return null;
  };

  const embedUrl = spotifyUri ? getEmbedUrl(spotifyUri) : 
                   spotifyUrl ? getEmbedUrlFromWebUrl(spotifyUrl) : null;

  if (!embedUrl) {
    return (
      <div className="p-4 theme-bg-tertiary rounded-lg text-center">
        <p className="text-sm theme-text-muted">
          {t('noSpotifyLink') || 'No Spotify link available'}
        </p>
      </div>
    );
  }

  if (compact && !showEmbed) {
    return (
      <div className="flex items-center gap-3 p-3 theme-bg-tertiary rounded-lg">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium theme-text-primary truncate">
            {albumTitle || 'Spotify'}
          </p>
          <p className="text-xs theme-text-muted">
            {t('clickToPlay') || 'Click to play'}
          </p>
        </div>
        <button
          onClick={() => setShowEmbed(true)}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition-colors"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <span className="text-sm font-medium theme-text-primary">
            {albumTitle || 'Spotify Player'}
          </span>
        </div>
        {compact && (
          <button
            onClick={() => setShowEmbed(false)}
            className="text-xs theme-text-muted hover:theme-text-primary"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="rounded-lg overflow-hidden" style={{ height: compact ? '80px' : '152px' }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="bg-transparent"
          title={`Spotify player for ${albumTitle || 'album'}`}
        />
      </div>
    </div>
  );
}

// Spotify Search/Link Input Component
interface SpotifyLinkInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export function SpotifyLinkInput({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder 
}: SpotifyLinkInputProps) {
  const { t } = useI18n();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Helper to extract Spotify URI from various input formats
  const normalizeSpotifyInput = (input: string): string => {
    // If it's already a URI, return as-is
    if (input.startsWith('spotify:')) {
      return input;
    }
    
    // Extract from open.spotify.com URL
    if (input.includes('open.spotify.com')) {
      const match = input.match(/open\.spotify\.com\/(album|track|playlist)\/([a-zA-Z0-9]+)/);
      if (match) {
        return `spotify:${match[1]}:${match[2]}`;
      }
    }
    
    // Return as-is if we can't parse it
    return input;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalizeSpotifyInput(e.target.value);
    onChange(normalized);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || t('spotifyUrlPlaceholder') || 'Paste Spotify URL or URI'}
        className="flex-1 px-3 py-2 theme-bg-tertiary theme-border border rounded-lg text-sm theme-text-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
      >
        {t('add') || 'Add'}
      </button>
    </form>
  );
}
