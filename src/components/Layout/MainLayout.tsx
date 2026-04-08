import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ConsolePanel } from "./ConsolePanel";

interface MainLayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onSearch: (query: string) => void;
  children: React.ReactNode;
}

export function MainLayout({ currentView, onNavigate, onSearch, children }: MainLayoutProps) {
  const [consoleOpen, setConsoleOpen] = useState(false);

  return (
    <div className="flex h-screen theme-bg-primary theme-text-primary">
      <Sidebar currentView={currentView} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onSearch={onSearch}
          onNavigate={onNavigate}
        />
        <main className="flex-1 overflow-y-auto theme-bg-secondary">
          {children}
        </main>
        <ConsolePanel isOpen={consoleOpen} onToggle={() => setConsoleOpen(!consoleOpen)} />
      </div>
    </div>
  );
}
