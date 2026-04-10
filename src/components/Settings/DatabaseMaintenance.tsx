import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface DatabaseMaintenanceProps {
  onDatabaseReset?: () => void;
}

export function DatabaseMaintenance({ onDatabaseReset }: DatabaseMaintenanceProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleClearCache = async () => {
    if (!confirm("Are you sure you want to clear the IGDB cache?\n\nThis will remove all cached search results and force re-authentication with IGDB.")) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await invoke("clear_igdb_cache");
      setMessage("IGDB cache cleared successfully!");
    } catch (e) {
      setError(`Failed to clear cache: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const openResetModal = () => {
    setShowResetModal(true);
    setConfirmText("");
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setConfirmText("");
  };

  const handleResetDatabase = async () => {
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await invoke("reset_database");
      setMessage("Database has been completely reset! All data cleared.");
      setShowResetModal(false);
      onDatabaseReset?.();
    } catch (e) {
      setError(`Failed to reset database: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Database Maintenance</h3>
          <p className="text-gray-400 text-sm">
            Advanced options for clearing cache and resetting the database.
            Use with caution!
          </p>
        </div>
      </div>

      {message && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg text-sm">
          ✓ {message}
        </div>
      )}

      {error && !showResetModal && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
          ✗ {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Clear Cache Button */}
        <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
          <div className="flex-1">
            <h4 className="text-white font-medium">Clear IGDB Cache</h4>
            <p className="text-gray-400 text-xs mt-1">
              Removes cached IGDB search results and authentication tokens.
              The app will need to re-authenticate with IGDB on next scan.
            </p>
          </div>
          <button
            onClick={handleClearCache}
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
          >
            {loading ? "Working..." : "Clear Cache"}
          </button>
        </div>

        {/* Reset Database Button */}
        <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg border border-red-900/50">
          <div className="flex-1">
            <h4 className="text-red-400 font-medium flex items-center gap-2">
              <span>⚠️</span> Reset Entire Database
            </h4>
            <p className="text-gray-400 text-xs mt-1">
              <strong className="text-red-400">DANGER:</strong> This will permanently delete ALL data including
              games, tags, folder paths, exclusions, and cache. This action cannot be undone!
            </p>
          </div>
          <button
            onClick={openResetModal}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
          >
            {loading ? "Working..." : "Reset All"}
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
        <p>
          <strong>Note:</strong> Consider exporting your collection before resetting the database.
          You can export from the Library page.
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl border border-red-600 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold text-white">Delete All Data?</h2>
              </div>
              <p className="text-gray-400 text-sm">
                This action is permanent and cannot be undone. All your data will be lost forever.
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                <p className="text-red-300 text-sm font-medium mb-3">
                  The following will be permanently deleted:
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    All games from your library
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    All custom tags
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    All scanned folder paths
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    All folder exclusion patterns
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✕</span>
                    IGDB cache and credentials
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">
                  To confirm, type <strong className="text-white font-mono bg-gray-800 px-2 py-0.5 rounded">DELETE</strong> below:
                </label>
                <input
                  id="delete-confirmation"
                  name="delete-confirmation"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE here..."
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={closeResetModal}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDatabase}
                disabled={loading || confirmText !== "DELETE"}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete Everything"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
