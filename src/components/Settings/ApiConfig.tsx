import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { IgdbCredentials } from "../../types";

export function ApiConfig() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    try {
      const creds = await invoke<IgdbCredentials | null>("get_igdb_credentials");
      if (creds) {
        setClientId(creds.client_id);
        setClientSecret(creds.client_secret);
        setIsConfigured(true);
      }
    } catch (error) {
      console.error("Failed to load credentials:", error);
    }
  }

  async function testConnection() {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      await invoke("test_igdb_connection", { clientId, clientSecret });
      setTestResult("success");
    } catch (error) {
      setTestResult("error");
      console.error("Test failed:", error);
    } finally {
      setIsTesting(false);
    }
  }

  async function saveCredentials() {
    setIsSaving(true);
    
    try {
      await invoke("save_igdb_credentials", { clientId, clientSecret });
      setIsConfigured(true);
      setTestResult(null);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">IGDB API Configuration</h2>
        <p className="text-gray-400 text-sm mb-4">
          Configure your Twitch API credentials to enable IGDB game matching.
          <a 
            href="https://dev.twitch.tv/console"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 ml-1"
          >
            Get credentials here →
          </a>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Client ID
          </label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your Twitch Client ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Client Secret
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your Twitch Client Secret"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={testConnection}
            disabled={!clientId || !clientSecret || isTesting}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTesting ? "Testing..." : "Test Connection"}
          </button>

          <button
            onClick={saveCredentials}
            disabled={!clientId || !clientSecret || isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>

          {isConfigured && !testResult && (
            <span className="text-green-400 text-sm">✓ Configured</span>
          )}

          {testResult === "success" && (
            <span className="text-green-400 text-sm">✓ Connection successful</span>
          )}

          {testResult === "error" && (
            <span className="text-red-400 text-sm">✗ Connection failed</span>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mt-6">
        <h3 className="text-sm font-medium text-gray-300 mb-2">How to get credentials:</h3>
        <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
          <li>Go to <span className="text-indigo-400">dev.twitch.tv/console</span></li>
          <li>Log in with your Twitch account</li>
          <li>Click "Register Your Application"</li>
          <li>Enter a name (e.g., "Pascal Game Manager")</li>
          <li>Set OAuth Redirect URI to <code className="bg-gray-900 px-1 rounded">http://localhost</code></li>
          <li>Category: "Application Integration"</li>
          <li>Copy Client ID and generate Client Secret</li>
        </ol>
      </div>
    </div>
  );
}
