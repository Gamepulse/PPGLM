import { useState, useCallback } from "react";
import { MainLayout } from "./components/Layout/MainLayout";
import { FolderPicker } from "./components/Scanner/FolderPicker";
import { GameList } from "./components/Library/GameList";
import { GameDetail } from "./components/Library/GameDetail";
import { SettingsPage } from "./components/Settings/SettingsPage";
import { StatisticsDashboard } from "./components/Library/StatisticsDashboard";
import type { ActiveFilter } from "./components/Library/GameList";

function App() {
  const [currentView, setCurrentView] = useState<string>("library");
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

    const handleNavigate = useCallback((view: string) => {
        setCurrentView(view);
        setSelectedGameId(null);
    }, []);

    const handleSelectGame = useCallback((id: number) => {
        setSelectedGameId(id);
        setCurrentView("game-detail");
    }, []);

    const handleBack = useCallback(() => {
        setCurrentView("library");
        setSelectedGameId(null);
    }, []);

    const handleFilterFromDetail = useCallback((type: string, value: string) => {
        const newFilter = { type, value, label: value };
        setActiveFilters(prev => {
          const exists = prev.some(f => f.type === type && f.value === value);
          if (exists) return prev;
          return [...prev, newFilter];
        });
        setCurrentView("library");
        setSelectedGameId(null);
    }, []);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setCurrentView("library");
    }, []);

    const handleGamesSaved = useCallback(() => {
      // Force library refresh
      setLibraryRefreshKey(prev => prev + 1);
      // Navigate to library to show new games
      setCurrentView("library");
    }, []);

    const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
        setActiveFilters(filters);
    }, []);

    const renderCurrentView = () => {
        switch (currentView) {
            case "scanner":
                return <FolderPicker onNavigate={handleNavigate} onGamesSaved={handleGamesSaved} />;
            case "settings":
                return <SettingsPage />;
            case "library":
                return (
                    <GameList 
                        key={libraryRefreshKey} 
                        onSelectGame={handleSelectGame} 
                        searchQuery={searchQuery}
                        activeFilters={activeFilters}
                        onFiltersChange={handleFiltersChange}
                    />
                );
            case "game-detail":
                return selectedGameId !== null ? (
                    <GameDetail 
                        gameId={selectedGameId} 
                        onBack={handleBack}
                        onFilter={handleFilterFromDetail}
                    />
                ) : (
                    <GameList 
                        key={libraryRefreshKey} 
                        onSelectGame={handleSelectGame} 
                        searchQuery=""
                        activeFilters={activeFilters}
                        onFiltersChange={handleFiltersChange}
                    />
                );
            case "statistics":
                return (
                    <StatisticsDashboard 
                        onSelectGame={handleSelectGame}
                        onFilterByGenre={(genre) => {
                            const newFilter = { type: 'genre', value: genre, label: genre };
                            setActiveFilters(prev => {
                              const exists = prev.some(f => f.type === 'genre' && f.value === genre);
                              if (exists) return prev;
                              return [...prev, newFilter];
                            });
                            setCurrentView("library");
                        }}
                    />
                );
            default:
                return (
                    <GameList 
                        key={libraryRefreshKey} 
                        onSelectGame={handleSelectGame} 
                        searchQuery=""
                        activeFilters={activeFilters}
                        onFiltersChange={handleFiltersChange}
                    />
                );
        }
    };

    return (
        <MainLayout
            currentView={currentView}
            onNavigate={handleNavigate}
            onSearch={handleSearch}
        >
            {renderCurrentView()}
        </MainLayout>
    );
}

export default App;
