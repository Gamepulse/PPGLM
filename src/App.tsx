import { useState, useCallback } from "react";
import { MainLayout } from "./components/Layout/MainLayout";
import { FolderPicker } from "./components/Scanner/FolderPicker";
import { GameList } from "./components/Library/GameList";
import { GameDetail } from "./components/Library/GameDetail";
import { SettingsPage } from "./components/Settings/SettingsPage";

function App() {
  const [currentView, setCurrentView] = useState<string>("library");
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);

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

    const renderCurrentView = () => {
        switch (currentView) {
            case "scanner":
                return <FolderPicker onNavigate={handleNavigate} onGamesSaved={handleGamesSaved} />;
            case "settings":
                return <SettingsPage />;
            case "library":
                return <GameList key={libraryRefreshKey} onSelectGame={handleSelectGame} searchQuery={searchQuery} />;
            case "game-detail":
                return selectedGameId !== null ? (
                    <GameDetail gameId={selectedGameId} onBack={handleBack} />
                ) : (
                    <GameList key={libraryRefreshKey} onSelectGame={handleSelectGame} searchQuery="" />
                );
            default:
                return <GameList key={libraryRefreshKey} onSelectGame={handleSelectGame} searchQuery="" />;
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
