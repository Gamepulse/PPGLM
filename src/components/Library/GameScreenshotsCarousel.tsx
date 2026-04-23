import { useState, useEffect } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface GameScreenshotsCarouselProps {
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

export function GameScreenshotsCarousel({ gameId }: GameScreenshotsCarouselProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [igdbScreenshots, setIgdbScreenshots] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScreenshots = async () => {
      setLoading(true);
      try {
        // Load game data to check IGDB ID
        try {
          const game = await invoke<{ igdb_id: number | null }>("get_game_by_id", { id: gameId });
          
          // Load IGDB screenshots if available
          if (game?.igdb_id) {
            try {
              const urls = await invoke<string[]>("get_igdb_screenshots", { gameId });
              console.log("[GameScreenshotsCarousel] IGDB URLs:", urls);
              setIgdbScreenshots(urls || []);
            } catch (e) {
              console.warn("Failed to load IGDB screenshots:", e);
            }
          }
        } catch (e) {
          console.warn("Failed to load game data:", e);
        }

        // Load local screenshots
        const localResult = await invoke<Screenshot[]>("get_screenshots", { gameId });
        const localScreenshots = localResult || [];
        setScreenshots(localScreenshots);
        console.log("[GameScreenshotsCarousel] Local screenshots:", localScreenshots.length);
      } catch (e) {
        console.error("Failed to load screenshots:", e);
      } finally {
        setLoading(false);
      }
    };

    loadScreenshots();
  }, [gameId]);

  const handleAddScreenshot = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (selected && typeof selected === "string") {
        await invoke("add_screenshot", { gameId, filePath: selected, caption: null });
        // Reload screenshots
        const localResult = await invoke<Screenshot[]>("get_screenshots", { gameId });
        setScreenshots(localResult || []);
      }
    } catch (e) {
      console.error("Failed to add screenshot:", e);
    }
  };

  const handleDeleteScreenshot = async (screenshotId: number) => {
    try {
      await invoke("delete_screenshot", { screenshotId });
      setScreenshots(screenshots.filter((s) => s.id !== screenshotId));
      if (currentIndex >= screenshots.length - 1) {
        setCurrentIndex(Math.max(0, screenshots.length - 2));
      }
    } catch (e) {
      console.error("Failed to delete screenshot:", e);
    }
  };

  const allImages = [...igdbScreenshots, ...screenshots.map((s) => convertFileSrc(s.file_path))];

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-800/50 rounded-lg flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (allImages.length === 0) {
    return (
      <div className="w-full">
        <div className="w-full h-48 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center gap-3">
          <div className="text-gray-400 text-sm">No screenshots yet</div>
          <button
            onClick={handleAddScreenshot}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            + Add Screenshot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Main carousel - reduced height */}
      <div className="relative w-full h-32 bg-gray-900 rounded-lg overflow-hidden">
        {allImages.map((url, index) => (
          <div
            key={index}
            className={`absolute inset-0 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={url}
              alt={`Screenshot ${index + 1}`}
              className="w-full h-full object-contain"
            />
          </div>
        ))}

        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % allImages.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              →
            </button>
          </>
        )}

        {/* Image counter */}
        <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
          {currentIndex + 1} / {allImages.length}
        </div>

        {/* Source indicator */}
        <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
          {currentIndex < igdbScreenshots.length ? "IGDB" : "Local"}
        </div>

        {/* Delete button for local screenshots */}
        {currentIndex >= igdbScreenshots.length && screenshots.length > 0 && (
          <button
            onClick={() => {
              const localIndex = currentIndex - igdbScreenshots.length;
              const screenshot = screenshots[localIndex];
              if (screenshot) {
                handleDeleteScreenshot(screenshot.id);
              }
            }}
            className="absolute bottom-2 right-2 px-3 py-1 bg-red-600/80 hover:bg-red-700 text-white rounded text-sm transition-colors"
          >
            🗑️ Delete
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((url, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-12 rounded overflow-hidden border-2 transition-colors ${
                index === currentIndex ? "border-indigo-500" : "border-transparent hover:border-gray-500"
              }`}
            >
              <img
                src={url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Add screenshot button */}
      <button
        onClick={handleAddScreenshot}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
      >
        + Add Screenshot
      </button>
    </div>
  );
}
