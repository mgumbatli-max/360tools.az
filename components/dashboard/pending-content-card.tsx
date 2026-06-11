import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { SectionCard } from "./section-card";

export interface PendingContentRow {
  id: number;
  title: string;
  platform: string;
  productName: string | null;
}

export function PendingContentCard({ items }: { items: PendingContentRow[] }) {
  return (
    <SectionCard title="Təsdiq gözləyən kontentlər" href="/elanlar">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <CheckCircle2 className="size-6 text-emerald-400" />
          <p className="text-sm text-zinc-500">Təsdiq gözləyən kontent yoxdur</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/elanlar/${item.id}`}
                className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-900">
                    {item.title}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-zinc-500">
                    {item.productName ?? "Məhsul tapılmadı"}
                  </div>
                </div>
                <PlatformBadge platform={item.platform} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
