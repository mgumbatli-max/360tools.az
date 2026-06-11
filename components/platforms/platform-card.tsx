"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Settings2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleEnabled } from "@/lib/actions/platforms";

export interface PlatformCardData {
  key: string;
  label: string;
  icon: string;
  isBuiltIn: boolean;
  enabled: boolean;
  ruleSummary: string;
  total: number;
  published: number;
}

export function PlatformCard({ data }: { data: PlatformCardData }) {
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    startTransition(async () => {
      await toggleEnabled(data.key);
      toast.success(data.enabled ? `${data.label} deaktiv edildi` : `${data.label} aktiv edildi`);
    });
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-xl" aria-hidden>
            {data.icon}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">{data.label}</span>
              <Badge variant={data.isBuiltIn ? "secondary" : "outline"} className="shrink-0">
                {data.isBuiltIn ? "Daxili" : "Xüsusi"}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{data.ruleSummary}</p>
          </div>
        </div>
        <Switch checked={data.enabled} onCheckedChange={onToggle} disabled={isPending} aria-label="Aktiv" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted/60 px-3 py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">{data.total}</div>
          <div className="text-xs text-muted-foreground">kontent (cəmi)</div>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2">
          <div className="text-lg font-semibold tabular-nums text-emerald-700">{data.published}</div>
          <div className="text-xs text-emerald-600">yerləşdirilmiş</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 pt-0">
        <Button variant="outline" size="sm" className="flex-1" render={<Link href={`/platformalar/${data.key}`} />}>
          <Settings2 />
          Qaydaları tənzimlə
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={`/elanlar?platform=${data.key}`} aria-label="Elanlara bax" />}
        >
          <ArrowUpRight />
        </Button>
      </div>
    </div>
  );
}
