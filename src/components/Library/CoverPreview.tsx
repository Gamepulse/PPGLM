interface CoverPreviewProps {
  coverUrl: string | null;
}

export function CoverPreview({ coverUrl }: CoverPreviewProps) {
  if (!coverUrl) return null;

  return (
    <div className="flex items-center gap-3">
      <img src={coverUrl} alt="Cover" className="w-16 h-20 object-cover rounded shadow-md" />
      <span className="text-gray-400 text-sm">Cover from IGDB</span>
    </div>
  );
}
