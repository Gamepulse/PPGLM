import { ApiConfig } from "./ApiConfig";
import { FolderExclusions } from "./FolderExclusions";
import { DatabaseMaintenance } from "./DatabaseMaintenance";
import { LanguageSelector } from "./LanguageSelector";
import { ScanFilesToggle } from "./ScanFilesToggle";
import { DistanceThresholdSlider } from "./DistanceThresholdSlider";
import { DeepScanToggle } from "./DeepScanToggle";
import { ConsoleSelector } from "./ConsoleSelector";
import { FontSizeSelector } from "./FontSizeSelector";
import { ScreenshotBackgroundSelector } from "./ScreenshotBackgroundSelector";
import { TagsSettings } from "./TagsSettings";
import { useI18n } from "../../i18n";

export function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-[90rem] mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6 theme-text-primary">{t('settings')}</h1>
      
      <div className="space-y-8">
        {/* Appearance Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold theme-text-secondary border-b theme-border pb-2">
            🎨 {t('appearance') || "Appearance"}
          </h2>
          <div className="grid gap-4 grid-cols-1">
            <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
              <LanguageSelector />
            </section>
            <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
              <FontSizeSelector />
            </section>
            <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
              <ScreenshotBackgroundSelector />
            </section>
            <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
              <TagsSettings />
            </section>
          </div>
        </div>

        {/* Scanner Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold theme-text-secondary border-b theme-border pb-2">
            🔍 {t('scannerSettings') || "Scanner Settings"}
          </h2>
          <div className="grid gap-4 grid-cols-1">
            <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
              <DistanceThresholdSlider />
            </section>
            <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
              <ScanFilesToggle />
            </section>
            <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
              <DeepScanToggle />
            </section>
            <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
              <FolderExclusions />
            </section>
          </div>
        </div>

        {/* Consoles Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold theme-text-secondary border-b theme-border pb-2">
            🎮 {t('myConsoles') || "My Consoles"}
          </h2>
          <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
            <ConsoleSelector />
          </section>
        </div>

        {/* API & Data Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold theme-text-secondary border-b theme-border pb-2">
            🔌 {t('apiAndData') || "API & Data"}
          </h2>
          <div className="grid gap-4 grid-cols-1">
            <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
              <ApiConfig />
            </section>
            <section className="theme-card rounded-lg p-4 sm:p-6 overflow-hidden">
              <DatabaseMaintenance />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
