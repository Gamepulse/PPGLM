export function formatRating(rating: number | null): string {
  if (rating === null) return "—";
  return `${rating}/10`;
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR");
  } catch {
    return dateStr;
  }
}
