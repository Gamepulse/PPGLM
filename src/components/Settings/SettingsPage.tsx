import { ApiConfig } from "./ApiConfig";
import { FolderExclusions } from "./FolderExclusions";
import { DatabaseMaintenance } from "./DatabaseMaintenance";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeSelector } from "./ThemeSelector";
import { ScanFilesToggle } from "./ScanFilesToggle";
import { useI18n } from "../../i18n";

export function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 theme-text-primary">{t('settings')}</h1>
      
      <div className="space-y-8">
        <section className="theme-card rounded-lg p-6">
          <LanguageSelector />
        </section>
        
        <section className="theme-card rounded-lg p-6">
          <ThemeSelector />
        </section>
        
        <section className="theme-card rounded-lg p-6">
          <ScanFilesToggle />
        </section>
        
        <section className="theme-card rounded-lg p-6">
          <ApiConfig />
        </section>
        
        <section className="theme-card rounded-lg p-6">
          <FolderExclusions />
        </section>
        
        <section className="theme-card rounded-lg p-6">
          <DatabaseMaintenance />
        </section>
      </div>
    </div>
  );
}
