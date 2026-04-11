import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Tag } from "../../types";
import { useI18n } from "../../i18n";
import { getCategoryColor } from "../../utils/colors";

export function TagsSettings() {
  const { t } = useI18n();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load all tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const result = await invoke<Tag[]>("get_tags");
      setTags(result || []);
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const newTag = await invoke<Tag>("create_tag", {
        name: newTagName.trim(),
        category: "custom"
      });
      
      if (newTag) {
        setTags(prev => [...prev, newTag]);
        setNewTagName("");
        setMessage(t('tagCreated') || 'Tag created successfully');
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
      setMessage(t('tagCreateError') || 'Failed to create tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm(t('confirmDeleteTag') || 'Delete this tag? It will be removed from all games.')) return;
    
    setLoading(true);
    try {
      await invoke("delete_tag", { tagId });
      setTags(prev => prev.filter(t => t.id !== tagId));
      if (selectedTag?.id === tagId) {
        setSelectedTag(null);
      }
      setMessage(t('tagDeleted') || 'Tag deleted');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to delete tag:", error);
      setMessage(t('tagDeleteError') || 'Failed to delete tag');
    } finally {
      setLoading(false);
    }
  };

  // Get all custom tags (excluding system tags like genres, etc.)
  const customTags = tags.filter(tag => tag.category === 'custom');
  const otherTags = tags.filter(tag => tag.category !== 'custom');

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        {t('customTags') || "Tags Perso"}
      </h2>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('Error') || message.includes('Failed') 
            ? 'bg-red-900/50 border border-red-700 text-red-200'
            : 'bg-green-900/50 border border-green-700 text-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Create New Tag */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          {t('createNewTag') || "Créer un nouveau tag"}
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            placeholder={t('tagNamePlaceholder') || "Nom du tag..."}
            disabled={loading}
            className="flex-1 px-3 py-2 theme-bg-tertiary theme-border border rounded-lg theme-text-primary focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            onClick={handleCreateTag}
            disabled={loading || !newTagName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '...' : (t('create') || "Créer")}
          </button>
        </div>
      </div>

      {/* Existing Tags */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          {t('existingCustomTags') || "Tags existants"}
        </h3>
        {customTags.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {t('noCustomTags') || "Aucun tag personnalisé créé"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {customTags.map(tag => (
              <div
                key={tag.id}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-white ${getCategoryColor(tag.category)} group`}
              >
                <span>{tag.name}</span>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  disabled={loading}
                  className="ml-1 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t('deleteTag') || "Supprimer"}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other Tags (read-only) */}
      {otherTags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            {t('systemTags') || "Tags système (automatiques)"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {otherTags.slice(0, 20).map(tag => (
              <span
                key={tag.id}
                className={`px-3 py-1.5 rounded-full text-sm text-white/70 ${getCategoryColor(tag.category)}`}
              >
                {tag.name}
              </span>
            ))}
            {otherTags.length > 20 && (
              <span className="px-3 py-1.5 rounded-full text-sm text-gray-500">
                +{otherTags.length - 20} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
