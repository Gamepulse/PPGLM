import { useRef, useEffect } from "react";
import { useConsole } from "../Layout/ConsolePanel";
import { useI18n } from "../../i18n";

interface ScanConsoleProps {
  minimized: boolean;
  onToggleMinimize: () => void;
}

function getLogColor(level: string) {
  switch (level) {
    case "error": return "text-red-400";
    case "warn": return "text-yellow-400";
    case "debug": return "theme-text-muted";
    default: return "text-blue-400";
  }
}

export function ScanConsole({ minimized, onToggleMinimize }: ScanConsoleProps) {
  const { t } = useI18n();
  const { logs } = useConsole();
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className={`bg-gray-950 rounded-lg theme-border overflow-hidden transition-all duration-200 ${minimized ? 'h-auto' : ''}`}>
      <div
        className="flex items-center justify-between px-3 py-2 theme-bg-secondary theme-border border-b cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs theme-text-muted">{minimized ? '▶' : '▼'}</span>
          <span className="text-xs font-medium theme-text-muted">{t('consoleOutput')}</span>
        </div>
        <span className="text-xs theme-text-muted">{logs.length} {t('messages')}</span>
      </div>
      {!minimized && (
        <div className="h-48 overflow-y-auto p-3 font-mono text-xs space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="theme-text-muted">[{log.timestamp.toLocaleTimeString()}]</span>
              <span className={getLogColor(log.level)}>[{log.level.toUpperCase()}]</span>
              <span className="theme-text-secondary">{log.message}</span>
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      )}
    </div>
  );
}
