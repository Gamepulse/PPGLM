import { useSettings } from "../../hooks/useSettings";

export function ScanFilesToggle() {
  const { scanFiles, setScanFiles, loading } = useSettings();

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">Scan Options</h2>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={scanFiles}
            onChange={(e) => setScanFiles(e.target.checked)}
            disabled={loading}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-white">Also scan individual files</span>
        </label>
      </div>
      <p className="text-gray-400 text-sm mt-2">
        When enabled, the scanner will also look for individual game files (executables) 
        in addition to folders. This is useful for detecting games that are single files 
        rather than folders.
      </p>
    </div>
  );
}
