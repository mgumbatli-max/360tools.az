import Link from "next/link";
import { cn } from "@/lib/utils";

interface FilterPillProps {
  label: string;
  active: boolean;
  count?: number;
  /** Verilərsə Link kimi render olunur (server komponentlər üçün) */
  href?: string;
  /** Verilərsə button kimi render olunur (client komponentlər üçün) */
  onClick?: () => void;
}

/**
 * Status/tip filtri üçün vahid pill komponenti.
 * Elanlar, şablonlar və kampaniyalar səhifələrində eyni görünüş üçün istifadə olunur.
 */
export function FilterPill({
  label,
  active,
  count,
  href,
  onClick,
}: FilterPillProps) {
  const className = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
  );

  const content = (
    <>
      {label}
      {count != null && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-xs leading-none tabular-nums",
            active
              ? "bg-indigo-100 text-indigo-700"
              : "bg-zinc-100 text-zinc-500"
          )}
        >
          {count}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
