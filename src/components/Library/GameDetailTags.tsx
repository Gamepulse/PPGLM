import type { Game } from "../../types";
import { useI18n } from "../../i18n";

interface GameDetailTagsProps {
  game: Game;
}

function TagList({ label, items, color }: { label: string; items: { id: number; name: string }[]; color: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="theme-text-muted text-sm">{label}:</span>
      {items.map((item) => (
        <span key={item.id} className={`px-2 py-1 text-xs rounded-full text-white ${color}`}>
          {item.name}
        </span>
      ))}
    </div>
  );
}

export function GameDetailTags({ game }: GameDetailTagsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-2 mt-4">
      <TagList label={t('genres')} items={game.genres} color="bg-blue-600" />
      <TagList label={t('gameModes')} items={game.game_modes} color="bg-purple-600" />
      <TagList label={t('perspective')} items={game.player_perspectives} color="bg-green-600" />
      <TagList label={t('themes')} items={game.themes} color="bg-orange-600" />
    </div>
  );
}
