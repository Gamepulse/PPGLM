import { useState, useEffect } from "react";
import type { Game } from "../../types";
import { useGames } from "../../hooks/useGames";
import { RatingInput } from "../common/RatingInput";
import { TagEditor } from "./TagEditor";
import { GameDetailHeader } from "./GameDetailHeader";
import { GameDetailInfo } from "./GameDetailInfo";
import { GameDetailTags } from "./GameDetailTags";
import { formatDate } from "../../utils/formatters";
import { useI18n } from "../../i18n";

interface GameDetailProps {
  gameId: number;
  onBack: () => void;
}

export function GameDetail({ gameId, onBack }: GameDetailProps) {
  const { t } = useI18n();
  const { getGame, updateRating, updateNotes, deleteGame, refreshGameFromIgdb } = useGames();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesValue, setNotesValue] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadGame(); }, [gameId]);

  async function loadGame() {
    setLoading(true);
    const g = await getGame(gameId);
    if (g) { setGame(g); setNotesValue(g.notes || ""); }
    setLoading(false);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="theme-text-muted text-lg">{t('loading')}</div></div>;
  if (!game) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="theme-text-muted text-lg mb-4">{t('gameNotFound')}</div>
      <button type="button" onClick={onBack} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{t('backToLibrary')}</button>
    </div>
  );

  const handleRatingChange = async (rating: number | null) => {
    await updateRating(game.id, rating);
    setGame({ ...game, personal_rating: rating });
  };

  const handleSaveNotes = async () => {
    await updateNotes(game.id, notesValue);
    setGame({ ...game, notes: notesValue });
  };

  const handleDelete = async () => { if (await deleteGame(game.id)) onBack(); };

  const handleRefresh = async () => {
    if (!game.igdb_id) return;
    setRefreshing(true);
    try { if (await refreshGameFromIgdb(game.id)) await loadGame(); } finally { setRefreshing(false); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button type="button" onClick={onBack} className="text-indigo-400 hover:text-indigo-300 mb-6 flex items-center gap-2">
        ← {t('backToLibrary')}
      </button>

      <GameDetailHeader game={game} refreshing={refreshing} onRefresh={handleRefresh} />
      <GameDetailTags game={game} />
      <GameDetailInfo game={game} />

      <div className="pt-4 theme-border border-t mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium theme-text-secondary mb-1">{t('personalRating')}</label>
          <RatingInput value={game.personal_rating} onChange={handleRatingChange} />
        </div>
        <div>
          <label className="block text-sm font-medium theme-text-secondary mb-1">{t('notes')}</label>
          <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)}
            onBlur={handleSaveNotes} rows={4}
            className="w-full px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={t('addNotes')} />
        </div>
        <div>
          <label className="block text-sm font-medium theme-text-secondary mb-1">{t('tags')}</label>
          <TagEditor gameId={game.id} tags={game.tags} onTagsChanged={loadGame} />
        </div>
        <div className="text-xs theme-text-muted pt-4">
          {t('added')}: {formatDate(game.created_at)} · {t('updated')}: {formatDate(game.updated_at)}
        </div>
        <div className="pt-4">
          <button type="button" onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            {t('deleteGame')}
          </button>
        </div>
      </div>
    </div>
  );
}
