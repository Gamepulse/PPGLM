/** Consolidated from TagEditor.tsx and GameCard.tsx */
export function getCategoryColor(category: string): string {
  // Couleurs aléatoires pour les tags personnalisés
  const customColors = [
    "bg-red-600",
    "bg-orange-600",
    "bg-amber-600",
    "bg-yellow-600",
    "bg-lime-600",
    "bg-green-600",
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-600",
    "bg-sky-600",
    "bg-blue-600",
    "bg-indigo-600",
    "bg-violet-600",
    "bg-purple-600",
    "bg-fuchsia-600",
    "bg-pink-600",
    "bg-rose-600",
    "bg-slate-600",
    "bg-zinc-600",
    "bg-stone-600",
  ];

  // Si c'est un tag custom, retourner une couleur aléatoire
  if (category === "custom") {
    const randomIndex = Math.floor(Math.random() * customColors.length);
    return customColors[randomIndex];
  }

  const colors: Record<string, string> = {
    genre: "bg-blue-600",
    developer: "bg-green-600",
    publisher: "bg-amber-600",
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
