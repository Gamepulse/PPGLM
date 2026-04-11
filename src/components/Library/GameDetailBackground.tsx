import { useState, useEffect } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { useSettings } from "../../hooks/useSettings";
import type { Game } from "../../types";

interface GameDetailBackgroundProps {
  gameId: number;
}

interface Screenshot {
  id: number;
  game_id: number;
  file_path: string;
  caption?: string | null;
  is_cover: boolean;
  created_at: string;
}

export function GameDetailBackground({ gameId }: GameDetailBackgroundProps) {
  const { screenshotBgCount } = useSettings();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [igdbScreenshots, setIgdbScreenshots] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load screenshots and game data for the game
  useEffect(() => {
    if (screenshotBgCount === 0) {
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      try {
        // Load game data to get cover URL
        let gameIgdbId: number | null = null;
        try {
          const game = await invoke<Game | null>("get_game_by_id", { id: gameId });
          if (game?.cover_url) {
            setCoverUrl(game.cover_url);
          }
          if (game?.igdb_id) {
            gameIgdbId = game.igdb_id;
          }
        } catch (e) {
          console.warn("Failed to load game data:", e);
        }

        // Load local screenshots
        const localResult = await invoke<Screenshot[]>("get_screenshots", { gameId });
        const localScreenshots = localResult || [];
        setScreenshots(localScreenshots);

        // Load IGDB screenshots (prioritaire - affiché en premier)
        if (gameIgdbId) {
          try {
            const urls = await invoke<string[]>("get_igdb_screenshots", { gameId });
            console.log("[GameDetailBackground] IGDB screenshot URLs:", urls);
            setIgdbScreenshots(urls || []);
          } catch (e) {
            console.warn("Failed to load IGDB screenshots:", e);
            setIgdbScreenshots([]);
          }
        }
      } catch (e) {
        console.error("Failed to load screenshots:", e);
        setScreenshots([]);
        setIgdbScreenshots([]);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [gameId, screenshotBgCount]);

  // Rotate through screenshots (and cover if no screenshots)
  useEffect(() => {
    const hasScreenshots = screenshots.length > 0 || igdbScreenshots.length > 0;
    const totalImages = igdbScreenshots.length + screenshots.length + (coverUrl && !hasScreenshots ? 1 : 0);
    if (totalImages <= 1 || screenshotBgCount <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(totalImages, screenshotBgCount));
    }, 5000);

    return () => clearInterval(interval);
  }, [screenshots, igdbScreenshots, coverUrl, screenshotBgCount]);

  if (screenshotBgCount === 0 || loading) {
    return null;
  }

  // IGDB screenshots are prioritized - shown first
  const igdbDisplay = igdbScreenshots.slice(0, screenshotBgCount);
  const localDisplay = screenshots.slice(0, Math.max(0, screenshotBgCount - igdbScreenshots.length));
  const hasScreenshots = screenshots.length > 0 || igdbScreenshots.length > 0;
  const totalImages = igdbScreenshots.length + screenshots.length + (coverUrl && !hasScreenshots ? 1 : 0);
  
  if (totalImages === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* IGDB screenshots - PRIORITIZED (shown first) */}
      {igdbDisplay.map((url, index) => (
        <div
          key={`igdb-${index}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={url}
            alt={`Screenshot ${index + 1}`}
            className="w-full h-full object-cover"
            style={{ 
              filter: "blur(8px) brightness(0.3)",
              transform: "scale(1.1)",
            }}
          />
        </div>
      ))}
      
      {/* Local screenshots (shown after IGDB) */}
      {localDisplay.map((screenshot, index) => {
        const actualIndex = igdbScreenshots.length + index;
        return (
          <div
            key={`local-${screenshot.id}`}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              actualIndex === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={convertFileSrc(screenshot.file_path)}
              alt={screenshot.caption || `Screenshot ${actualIndex + 1}`}
              className="w-full h-full object-cover"
              style={{ 
                filter: "blur(8px) brightness(0.3)",
                transform: "scale(1.1)",
              }}
            />
          </div>
        );
      })}
      
      {/* Cover image as fallback when no screenshots at all */}
      {!hasScreenshots && coverUrl && (
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentIndex === 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={coverUrl}
            alt="Game cover"
            className="w-full h-full object-cover"
            style={{ 
              filter: "blur(8px) brightness(0.25)",
              transform: "scale(1.15)",
            }}
          />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/90" />
      
      {totalImages > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {Array.from({ length: Math.min(totalImages, screenshotBgCount) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-white/30"
              }`}
              aria-label={`Show image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
