import { useState, useEffect } from "react";
import { useI18n } from "../../i18n";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const navItems = [
  { id: "scanner", icon: "🔍" },
  { id: "library", icon: "📚" },
  { id: "statistics", icon: "📊" },
  { id: "settings", icon: "⚙️" },
];

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", String(expanded));
  }, [expanded]);

  const getLabel = (id: string) => {
    switch (id) {
      case 'scanner': return t('scanner');
      case 'library': return t('library');
      case 'statistics': return t('statistics');
      case 'settings': return t('settings');
      default: return id;
    }
  };

  return (
    <div
      className={`${
        expanded ? "w-48" : "w-16"
      } transition-all duration-200 theme-sidebar border-r theme-border flex flex-col h-screen`}
    >
      <div className="p-4 border-b theme-border overflow-hidden whitespace-nowrap">
        <span className="text-indigo-500 font-bold text-sm tracking-wider">Pascal</span>
      </div>
      <nav className="flex-1 pt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors overflow-hidden whitespace-nowrap ${
              currentView === item.id
                ? "theme-bg-tertiary border-l-2 border-indigo-500 text-indigo-500"
                : "theme-text-secondary hover:theme-text-primary hover:theme-bg-tertiary"
            }`}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <span
              className={`text-sm transition-opacity ${
                expanded ? "opacity-100" : "opacity-0"
              }`}
            >
              {getLabel(item.id)}
            </span>
          </button>
        ))}
      </nav>
      <button
        onClick={() => setExpanded(!expanded)}
        className="p-4 border-t theme-border theme-text-muted hover:theme-text-primary transition-colors flex items-center justify-center"
        title={expanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <span className="text-lg">{expanded ? "◀" : "▶"}</span>
      </button>
    </div>
  );
}
