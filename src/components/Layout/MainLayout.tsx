import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onSearch: (query: string) => void;
  onFilterByTag?: (tagName: string) => void;
  activeFilters?: Array<{ type: string; value: string; label?: string }>;
  onRemoveFilter?: (type: string, value: string) => void;
  onClearAllFilters?: () => void;
  children: React.ReactNode;
}

export function MainLayout({ currentView, onNavigate, onSearch, onFilterByTag, activeFilters, onRemoveFilter, onClearAllFilters, children }: MainLayoutProps) {
  return (
    <div className="flex h-screen theme-bg-primary theme-text-primary">
      <Sidebar currentView={currentView} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onSearch={onSearch}
          onNavigate={onNavigate}
          onFilterByTag={onFilterByTag}
          activeFilters={activeFilters}
          onRemoveFilter={onRemoveFilter}
          onClearAllFilters={onClearAllFilters}
        />
        <main className="flex-1 overflow-y-auto theme-bg-secondary">
          {children}
        </main>
      </div>
    </div>
  );
}
