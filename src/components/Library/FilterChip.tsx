import type { ReactNode } from "react";

interface FilterChipProps {
  children: ReactNode;
  label: string;
  className: string;
  onActivate?: () => void;
}

/** Static metadata becomes a keyboard-operable control only when it can filter. */
export function FilterChip({ children, label, className, onActivate }: FilterChipProps) {
  if (!onActivate) return <span className={className}>{children}</span>;

  return (
    <button
      type="button"
      aria-label={label}
      className={`${className} cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400`}
      onClick={(event) => {
        event.stopPropagation();
        onActivate();
      }}
    >
      {children}
    </button>
  );
}
