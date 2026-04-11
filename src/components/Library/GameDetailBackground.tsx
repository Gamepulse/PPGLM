import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load screenshots for the game
  useEffect(() => {
    if (screenshotBgCount === 0) {
      setLoading(false);
      return;
    }

    const loadScreenshots = async () => {
      try {
        // Note: This command needs to be implemented in the backend
        // For now, this will fail gracefully
        const result = await invoke<Screenshot[]>("get_screenshots", { gameId });
        setScreenshots(result || []);
      } catch (e) {
        // Silently fail if screenshots aren't implemented yet
        console.log("Screenshots not yet implemented:", e);
        setScreenshots([]);
      } finally {
        setLoading(false);
      }
    };

    loadScreenshots();
  }, [gameId, screenshotBgCount]);

  // Rotate through screenshots
  useEffect(() => {
    if (screenshots.length <= 1 || screenshotBgCount <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(screenshots.length, screenshotBgCount));
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [screenshots, screenshotBgCount]);

  if (screenshotBgCount === 0 || loading || screenshots.length === 0) {
    return null;
  }

  const displayScreenshots = screenshots.slice(0, screenshotBgCount);
  const currentScreenshot = displayScreenshots[currentIndex];

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {/* Background Image */}
      {displayScreenshots.map((screenshot, index) => (
        <div
          key={screenshot.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={`file://${screenshot.file_path}`}
            alt={screenshot.caption || `Screenshot ${index + 1}`}
            className="w-full h-full object-cover"
            style={{ 
              filter: "blur(8px) brightness(0.3)",
              transform: "scale(1.1)", // Slight zoom to prevent blur edges
            }}
          />
        </div>
      ))}
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/90" />
      
      {/* Screenshot indicators */}
      {displayScreenshots.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {displayScreenshots.map((_, index) => (
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
