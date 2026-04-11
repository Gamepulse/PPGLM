import { useState, useEffect } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { useSettings } from "../../hooks/useSettings";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load screenshots for the game
  useEffect(() => {
    if (screenshotBgCount === 0) {
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      try {
        // Load local screenshots
        const localResult = await invoke<Screenshot[]>("get_screenshots", { gameId });
        const localScreenshots = localResult || [];
        setScreenshots(localScreenshots);

        // If no local screenshots, load IGDB screenshots
        if (localScreenshots.length === 0) {
          try {
            const urls = await invoke<string[]>("get_igdb_screenshots", { gameId });
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

  // Rotate through screenshots
  useEffect(() => {
    const totalScreenshots = screenshots.length + igdbScreenshots.length;
    if (totalScreenshots <= 1 || screenshotBgCount <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(totalScreenshots, screenshotBgCount));
    }, 5000);

    return () => clearInterval(interval);
  }, [screenshots, igdbScreenshots, screenshotBgCount]);

  if (screenshotBgCount === 0 || loading) {
    return null;
  }

  const localDisplay = screenshots.slice(0, screenshotBgCount);
  const totalScreenshots = screenshots.length + igdbScreenshots.length;
  
  if (totalScreenshots === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Local screenshots */}
      {localDisplay.map((screenshot, index) => (
        <div
          key={`local-${screenshot.id}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={convertFileSrc(screenshot.file_path)}
            alt={screenshot.caption || `Screenshot ${index + 1}`}
            className="w-full h-full object-cover"
            style={{ 
              filter: "blur(8px) brightness(0.3)",
              transform: "scale(1.1)",
            }}
          />
        </div>
      ))}
      
      {/* IGDB screenshots */}
      {igdbScreenshots.slice(0, Math.max(0, screenshotBgCount - screenshots.length)).map((url, index) => {
        const actualIndex = screenshots.length + index;
        return (
          <div
            key={`igdb-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              actualIndex === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={url}
              alt={`Screenshot ${actualIndex + 1}`}
              className="w-full h-full object-cover"
              style={{ 
                filter: "blur(8px) brightness(0.3)",
                transform: "scale(1.1)",
              }}
            />
          </div>
        );
      })}
      
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/90" />
      
      {totalScreenshots > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {Array.from({ length: Math.min(totalScreenshots, screenshotBgCount) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-white/30"
              }`}
              aria-label={`Show screenshot ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
