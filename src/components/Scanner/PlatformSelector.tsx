import { useState, useRef, useEffect } from "react";
import { useI18n } from "../../i18n";
import { useSettings } from "../../hooks/useSettings";

interface PlatformSelectorProps {
  currentPlatform: string | null | undefined;
  onSelect: (platform: string | null) => void;
  size?: "sm" | "md";
}

const PLATFORM_GROUPS = [
  {
    label: "💻 PC",
    options: [{ value: "pc", label: "PC" }],
  },
  {
    label: "🎮 PlayStation",
    options: [
      { value: "ps5", label: "PlayStation 5" },
      { value: "ps4", label: "PlayStation 4" },
      { value: "ps3", label: "PlayStation 3" },
      { value: "ps2", label: "PlayStation 2" },
      { value: "ps1", label: "PlayStation" },
    ],
  },
  {
    label: "🎯 Xbox",
    options: [
      { value: "xbox_series", label: "Xbox Series X|S" },
      { value: "xbox_one", label: "Xbox One" },
      { value: "xbox_360", label: "Xbox 360" },
    ],
  },
  {
    label: "🕹️ Nintendo",
    options: [
      { value: "nintendo_switch", label: "Nintendo Switch" },
      { value: "nintendo_wiiu", label: "Nintendo Wii U" },
      { value: "nintendo_wii", label: "Nintendo Wii" },
      { value: "nintendo_3ds", label: "Nintendo 3DS" },
      { value: "nintendo_ds", label: "Nintendo DS" },
    ],
  },
  {
    label: "📱 Mobile",
    options: [{ value: "mobile", label: "Mobile" }],
  },
  {
    label: "📟 Other",
    options: [{ value: "other", label: "Other" }],
  },
];

const PLATFORM_ICONS: Record<string, string> = {
  pc: "💻",
  ps5: "🎮",
  ps4: "🎮",
  ps3: "🎮",
  ps2: "🎮",
  ps1: "🎮",
  xbox_series: "🎯",
  xbox_one: "🎯",
  xbox_360: "🎯",
  nintendo_switch: "🕹️",
  nintendo_wiiu: "🕹️",
  nintendo_wii: "🕹️",
  nintendo_3ds: "🕹️",
  nintendo_ds: "🕹️",
  mobile: "📱",
  other: "📟",
};

export function PlatformSelector({ currentPlatform, onSelect, size = "md" }: PlatformSelectorProps) {
  const { t } = useI18n();
  const { activeConsoles } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter groups to only show active consoles
  const filteredGroups = PLATFORM_GROUPS
    .map(group => ({
      ...group,
      options: group.options.filter(opt => activeConsoles.includes(opt.value))
    }))
    .filter(group => group.options.length > 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string | null) => {
    onSelect(value);
    setIsOpen(false);
  };

  const buttonSizeClasses = size === "sm" 
    ? "px-2 py-1 text-xs" 
    : "px-3 py-1.5 text-sm";

  const dropdownSizeClasses = size === "sm"
    ? "min-w-[180px]"
    : "min-w-[220px]";

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${buttonSizeClasses} rounded-lg border theme-border theme-bg-tertiary theme-text-secondary hover:theme-text-primary hover:bg-gray-700 transition-colors flex items-center gap-2`}
        title={t("selectPlatform") || "Select platform"}
      >
        {currentPlatform ? (
          <>
            <span>{PLATFORM_ICONS[currentPlatform] || "📟"}</span>
            <span className="truncate max-w-[100px]">
              {PLATFORM_GROUPS.flatMap(g => g.options).find(o => o.value === currentPlatform)?.label || currentPlatform}
            </span>
          </>
        ) : (
          <>
            <span>❓</span>
            <span>{t("noPlatform") || "No platform"}</span>
          </>
        )}
        <span className="ml-1">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-1 ${dropdownSizeClasses} max-h-[300px] overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-lg`}>
          <button
            onClick={() => handleSelect(null)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 ${!currentPlatform ? "bg-gray-700 text-indigo-400" : "text-gray-300"}`}
          >
            ❓ {t("noPlatform") || "No platform"}
            {!currentPlatform && <span className="ml-auto text-indigo-400">✓</span>}
          </button>

            {filteredGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1 text-xs text-gray-500 mt-1 border-t border-gray-700">
                {group.label}
              </div>
              {group.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 ${currentPlatform === option.value ? "bg-gray-700 text-indigo-400" : "text-gray-300"}`}
                >
                  <span>{PLATFORM_ICONS[option.value] || "📟"}</span>
                  <span>{option.label}</span>
                  {currentPlatform === option.value && <span className="ml-auto text-indigo-400">✓</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
