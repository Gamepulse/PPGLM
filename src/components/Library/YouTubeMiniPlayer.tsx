import { useState } from 'react';
import { useI18n } from '../../i18n';

interface YouTubePlayerProps {
  videoId: string | null;
  title?: string | null;
  compact?: boolean;
}

export function YouTubeMiniPlayer({ videoId, title, compact = false }: YouTubePlayerProps) {
  const { t } = useI18n();
  const [showEmbed, setShowEmbed] = useState(false);

  // Handle null videoId
  if (!videoId) {
    return (
      <div className="p-3 theme-bg-tertiary rounded-lg text-center">
        <p className="text-sm theme-text-muted">{t('invalidYouTubeUrl') || 'Invalid YouTube URL'}</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  if (compact && !showEmbed) {
    return (
      <div className="flex items-center gap-3 p-3 theme-bg-tertiary rounded-lg">
        <div className="relative w-20 h-12 flex-shrink-0 rounded overflow-hidden cursor-pointer" onClick={() => setShowEmbed(true)}>
          <img
            src={thumbnailUrl}
            alt={title || 'YouTube Video'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
            <span className="text-white text-xl">▶</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium theme-text-primary truncate">
            {title || t('youtubeVideo') || 'YouTube Video'}
          </p>
          <p className="text-xs theme-text-muted">
            {t('clickToPlay') || 'Click to play'}
          </p>
        </div>
        <button
          onClick={() => setShowEmbed(true)}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition-colors"
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
          <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">▶</span>
          </div>
          <span className="text-sm font-medium theme-text-primary">
            {title || t('youtubePlayer') || 'YouTube Player'}
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
      
      <div className="rounded-lg overflow-hidden" style={{ height: compact ? '150px' : '200px' }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="bg-black"
          title={`YouTube player for ${title || 'video'}`}
        />
      </div>
    </div>
  );
}

// YouTube URL Input Component
interface YouTubeLinkInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export function YouTubeLinkInput({ value, onChange, onSubmit, placeholder }: YouTubeLinkInputProps) {
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('youtubeUrlPlaceholder') || 'Paste YouTube URL or video ID'}
        className="flex-1 px-3 py-2 theme-bg-tertiary theme-border border rounded-lg text-sm theme-text-primary focus:ring-2 focus:ring-red-500 focus:border-transparent"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
      >
        {t('add') || 'Add'}
      </button>
    </form>
  );
}
