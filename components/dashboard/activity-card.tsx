import { History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { az } from "date-fns/locale";
import { SectionCard } from "./section-card";

export interface ActivityRow {
  id: number;
  action: string;
  target: string | null;
  createdAt: string;
  memberName: string | null;
  avatarColor: string | null;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function relativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true, locale: az });
}

export function ActivityCard({ items }: { items: ActivityRow[] }) {
  return (
    <SectionCard title="Son fəaliyyət" href="/komanda">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <History className="size-6 text-zinc-300" />
          <p className="text-sm text-zinc-500">Hələ fəaliyyət qeydi yoxdur</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ backgroundColor: item.avatarColor ?? "#71717a" }}
              >
                {item.memberName ? initials(item.memberName) : "S"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-zinc-700">
                  <span className="font-medium text-zinc-900">
                    {item.memberName ?? "Sistem"}
                  </span>{" "}
                  {item.action}
                  {item.target && (
                    <span className="font-medium text-zinc-900"> — {item.target}</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">{relativeTime(item.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
