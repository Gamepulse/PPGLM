import type { Game } from "../../types";
import { useI18n } from "../../i18n";

interface GameDetailTagsProps {
  game: Game;
  onFilter?: (type: string, value: string) => void;
}

function TagList({ 
  label, 
  items, 
  color, 
  filterType, 
  onFilter 
}: { 
  label: string; 
  items: { id: number; name: string }[]; 
  color: string;
  filterType: string;
  onFilter?: (type: string, value: string) => void;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="theme-text-muted text-sm">{label}:</span>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onFilter?.(filterType, item.name)}
          className={`px-2 py-1 text-xs rounded-full text-white ${color} hover:opacity-80 transition-opacity cursor-pointer`}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}

export function GameDetailTags({ game, onFilter }: GameDetailTagsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-2 mt-4">
      <TagList 
        label={t('genres')} 
        items={game.genres} 
        color="bg-blue-600" 
        filterType="genre"
        onFilter={onFilter}
      />
      <TagList 
        label={t('gameModes')} 
        items={game.game_modes} 
        color="bg-purple-600" 
        filterType="mode"
        onFilter={onFilter}
      />
      <TagList 
        label={t('perspective')} 
        items={game.player_perspectives} 
        color="bg-green-600" 
        filterType="perspective"
        onFilter={onFilter}
      />
      <TagList 
        label={t('themes')} 
        items={game.themes} 
        color="bg-orange-600" 
        filterType="theme"
        onFilter={onFilter}
      />
    </div>
  );
}
