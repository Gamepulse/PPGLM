import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";

interface LogEntry {
  id: number;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  details?: string;
}

interface ConsoleContextType {
  logs: LogEntry[];
  log: (level: LogEntry["level"], message: string, details?: string) => void;
  clear: () => void;
}

const ConsoleContext = createContext<ConsoleContextType | null>(null);

let logId = 0;

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const log = (level: LogEntry["level"], message: string, details?: string) => {
    setLogs((prev) => [
      ...prev.slice(-199), // Keep last 200 logs
      { id: ++logId, timestamp: new Date(), level, message, details },
    ]);
  };

  const clear = () => setLogs([]);

  // Intercept console methods
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(...args);
      log("info", args.map(String).join(" "));
    };
    console.warn = (...args) => {
      originalWarn(...args);
      log("warn", args.map(String).join(" "));
    };
    console.error = (...args) => {
      originalError(...args);
      log("error", args.map(String).join(" "));
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return (
    <ConsoleContext.Provider value={{ logs, log, clear }}>
      {children}
    </ConsoleContext.Provider>
  );
}

export function useConsole() {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error("useConsole must be used within ConsoleProvider");
  return ctx;
}

interface ConsolePanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ConsolePanel({ isOpen, onToggle }: ConsolePanelProps) {
  const { logs, clear } = useConsole();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const levelColors: Record<LogEntry["level"], string> = {
    info: "text-gray-300",
    warn: "text-yellow-400",
    error: "text-red-400",
    debug: "text-blue-400",
  };

  const levelBadge: Record<LogEntry["level"], string> = {
    info: "bg-gray-600 text-gray-200",
    warn: "bg-yellow-600 text-yellow-100",
    error: "bg-red-600 text-red-100",
    debug: "bg-blue-600 text-blue-100",
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="h-6 bg-gray-900 border-t border-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors text-xs"
      >
        ▲ Console ({logs.length})
      </button>
    );
  }

  return (
    <div className="h-1/3 min-h-[15vh] max-h-[40vh] flex flex-col bg-gray-950 border-t border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900 border-b border-gray-800">
        <span className="text-xs text-gray-400 font-medium">Console ({logs.length})</span>
        <div className="flex gap-3">
          <button
            onClick={clear}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={onToggle}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            ▼ Hide
          </button>
        </div>
      </div>

      {/* Logs */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto font-mono text-xs p-3 space-y-1.5">
        {logs.length === 0 ? (
          <div className="text-gray-600 italic">No logs yet...</div>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="flex gap-3 items-start">
              <span className="text-gray-500 shrink-0 tabular-nums">
                {entry.timestamp.toLocaleTimeString()}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${levelBadge[entry.level]}`}>
                {entry.level.toUpperCase()}
              </span>
              <span className={`${levelColors[entry.level]} break-words min-w-0`}>
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
