import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Tag } from "../../types";
import { getCategoryColor } from "../../utils/colors";

interface TagEditorProps {
  gameId: number;
  tags: Tag[];
  onTagsChanged: () => void;
}

export function TagEditor({ gameId, tags, onTagsChanged }: TagEditorProps) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load all available tags from the database
  useEffect(() => {
    const loadAllTags = async () => {
      try {
        const result = await invoke<Tag[]>("get_tags");
        setAllTags(result || []);
      } catch (error) {
        console.error("Failed to load tags:", error);
      }
    };
    loadAllTags();
  }, []);

  // Filter tags that are not already assigned to this game
  useEffect(() => {
    if (inputValue.trim()) {
      const gameTagIds = new Set(tags.map(t => t.id));
      const filtered = allTags.filter(tag =>
        !gameTagIds.has(tag.id) &&
        tag.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredTags(filtered);
      setShowCreateOption(filtered.length === 0);
    } else {
      const gameTagIds = new Set(tags.map(t => t.id));
      const available = allTags.filter(tag => !gameTagIds.has(tag.id));
      setFilteredTags(available.slice(0, 10)); // Show first 10 available
      setShowCreateOption(false);
    }
  }, [inputValue, allTags, tags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowDropdown(true);
  };

  const handleAddTag = async (tag: Tag) => {
    try {
      await invoke("add_tag_to_game", { gameId, tagId: tag.id });
      setInputValue("");
      setShowDropdown(false);
      onTagsChanged();
    } catch (error) {
      console.error("Failed to add tag:", error);
    }
  };

  const handleCreateTag = async () => {
    try {
      // Add # prefix if not already present
      let tagName = inputValue.trim();
      if (!tagName.startsWith('#')) {
        tagName = '#' + tagName;
      }
      
      // Create new tag
      const newTag = await invoke<Tag>("create_tag", { 
        name: tagName, 
        category: "custom" 
      });
      
      if (newTag) {
        // Add it to the game
        await invoke("add_tag_to_game", { gameId, tagId: newTag.id });
        setAllTags(prev => [...prev, newTag]);
      }
      
      setInputValue("");
      setShowDropdown(false);
      onTagsChanged();
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await invoke("remove_tag_from_game", { gameId, tagId });
      onTagsChanged();
    } catch (error) {
      console.error("Failed to remove tag:", error);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span
            key={tag.id}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(tag.category)}`}
          >
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 text-white hover:text-gray-200"
              aria-label={`Remove tag ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder="Add tag..."
          className="w-full px-3 py-2 theme-bg-tertiary theme-text-primary rounded-md border theme-border focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        {showDropdown && (filteredTags.length > 0 || showCreateOption) && (
          <div className="absolute z-10 w-full mt-1 theme-bg-tertiary border theme-border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filteredTags.length > 0 && (
              <div className="p-1">
                <div className="px-2 py-1 text-xs theme-text-muted">Click to add:</div>
                {filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag)}
                    className="w-full text-left px-3 py-2 text-sm theme-text-secondary hover:theme-bg-secondary hover:theme-text-primary rounded-md transition-colors"
                  >
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getCategoryColor(tag.category)}`}></span>
                    {tag.name}
                  </button>
                ))}
              </div>
            )}

            {showCreateOption && inputValue.trim() && (
              <div className="p-1 border-t theme-border">
                <button
                  onClick={handleCreateTag}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-400 hover:theme-bg-secondary hover:text-indigo-300 rounded-md transition-colors"
                >
                  + Create new tag "{inputValue.trim().startsWith('#') ? inputValue.trim() : '#' + inputValue.trim()}"
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
