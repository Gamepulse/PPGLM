import { useState } from "react";
import { Logo } from "./Logo";

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavigate?: (view: string) => void;
}

export function Header({ onSearch, onNavigate }: HeaderProps) {
  const [query, setQuery] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleLogoClick = () => {
    if (onNavigate) {
      onNavigate("library");
    }
  };

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
      <Logo onClick={handleLogoClick} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search games..."
        className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none w-64 placeholder-gray-500"
      />
    </header>
  );
}
