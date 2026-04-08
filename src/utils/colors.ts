/** Consolidated from TagEditor.tsx and GameCard.tsx */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    genre: "bg-blue-600",
    developer: "bg-green-600",
    publisher: "bg-amber-600",
    custom: "bg-purple-600",
  };
  return colors[category] || "bg-gray-600";
}

/** Consolidated from ScanResults.tsx */
export function getBadgeColor(confidence: string): string {
  switch (confidence) {
    case "Exact":
      return "bg-green-600";
    case "Fuzzy":
      return "bg-blue-600";
    default:
      return "bg-gray-600";
  }
}
