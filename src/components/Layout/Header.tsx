import { useState } from "react";
import { Logo } from "./Logo";

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavigate?: (view: string) => void;
}

export function Header({ onSearch, onNavigate }: HeaderProps) {
  const [query, setQuery] = useState("");

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value.trim());
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const handleLogoClick = () => {
    if (onNavigate) {
      onNavigate("library");
    }
  };

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
      <Logo onClick={handleLogoClick} />
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search games..."
          className="bg-gray-800 text-white text-sm px-4 py-2 pr-8 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none w-64 placeholder-gray-500"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-xs"
          >
            ✕
          </button>
        )}
      </div>
    </header>
  );
}
