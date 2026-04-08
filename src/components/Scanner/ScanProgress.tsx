interface ScanProgressProps {
  scanning: boolean;
  matching: boolean;
  resultCount?: number;
}

export function ScanProgress({ scanning, matching, resultCount }: ScanProgressProps) {
  if (!scanning && !matching) return null;

  const text = scanning
    ? "Scanning folders..."
    : matching
      ? "Matching with Steam..."
      : "";

  return (
    <div className="mt-4 p-4 bg-gray-900 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full animate-pulse w-full" />
          </div>
        </div>
        <span className="text-white text-sm font-medium">
          {text}
          {resultCount ? ` (${resultCount} found)` : ""}
        </span>
      </div>
    </div>
  );
}
