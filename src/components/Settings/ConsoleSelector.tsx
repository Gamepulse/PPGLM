import { useSettings } from "../../hooks/useSettings";
import { useI18n } from "../../i18n";

export function ConsoleSelector() {
  const { t } = useI18n();
  const { availableConsoles, activeConsoles, toggleConsole, setActiveConsoles, loading } = useSettings();

  // Group consoles by category
  const consoleGroups = [
    {
      label: "💻 PC",
      consoles: availableConsoles.filter(c => c.id === "pc"),
    },
    {
      label: "🎮 PlayStation",
      consoles: availableConsoles.filter(c => c.id.startsWith("ps")),
    },
    {
      label: "🎯 Xbox",
      consoles: availableConsoles.filter(c => c.id.startsWith("xbox")),
    },
    {
      label: "🕹️ Nintendo",
      consoles: availableConsoles.filter(c => c.id.startsWith("nintendo")),
    },
    {
      label: "📱 Other",
      consoles: availableConsoles.filter(c => c.id === "mobile" || c.id === "other"),
    },
  ];

  const handleSelectAll = () => {
    // Set all consoles at once
    setActiveConsoles(availableConsoles.map(c => c.id));
  };

  const handleSelectNone = () => {
    // Clear all consoles at once
    setActiveConsoles([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          {t('myConsoles') || "My Consoles"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            disabled={loading}
            className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {t('selectAll') || "Select All"}
          </button>
          <button
            onClick={handleSelectNone}
            disabled={loading}
            className="text-xs px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {t('selectNone') || "Select None"}
          </button>
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        {t('myConsolesDesc') || "Select the consoles you own. Only these platforms will be shown in the Consoles view and platform selectors."}
      </p>

      <div className="space-y-4">
        {consoleGroups.map((group) => (
          <div key={group.label} className="bg-gray-800/50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-gray-300 mb-2">{group.label}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {group.consoles.map((console) => {
                const isActive = activeConsoles.includes(console.id);
                return (
                  <button
                    key={console.id}
                    onClick={() => toggleConsole(console.id)}
                    disabled={loading}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                      isActive
                        ? "bg-indigo-600/30 border-indigo-500 text-white"
                        : "bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700"
                    } disabled:opacity-50`}
                  >
                    <span className="text-lg">{console.icon}</span>
                    <span className="text-sm truncate">{console.name}</span>
                    {isActive && <span className="ml-auto text-indigo-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
        <p className="text-xs text-gray-500">
          {t('activeConsolesCount') || "Active consoles"}: 
          <span className="text-indigo-400 font-medium ml-1">
            {activeConsoles.length} / {availableConsoles.length}
          </span>
        </p>
      </div>
    </div>
  );
}
