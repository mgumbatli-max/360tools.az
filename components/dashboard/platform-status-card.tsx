import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTENT_STATUSES, CONTENT_STATUS_KEYS } from "@/lib/constants";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { SectionCard } from "./section-card";

export interface PlatformStatusRow {
  platform: string;
  total: number;
  counts: Record<string, number>;
}

export function PlatformStatusCard({ rows }: { rows: PlatformStatusRow[] }) {
  return (
    <SectionCard title="Platformalar üzrə status" href="/elanlar">
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Layers className="size-6 text-zinc-300" />
          <p className="text-sm text-zinc-500">Hələ heç bir platformada kontent yoxdur</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <li
              key={row.platform}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2.5 first:pt-0 last:pb-0"
            >
              <PlatformBadge platform={row.platform} />
              <div className="flex flex-wrap items-center gap-1.5">
                {CONTENT_STATUS_KEYS.map((key) => {
                  const n = row.counts[key];
                  if (!n) return null;
                  return (
                    <span
                      key={key}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        CONTENT_STATUSES[key].color
                      )}
                    >
                      {CONTENT_STATUSES[key].label}: {n}
                    </span>
                  );
                })}
                <span className="ml-1 min-w-6 text-right text-sm font-semibold tabular-nums text-zinc-900">
                  {row.total}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
