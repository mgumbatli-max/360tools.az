"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { cn } from "@/lib/utils";
import {
  CALENDAR_ENTRY_TYPES,
  PLATFORMS,
  formatDate,
  type CalendarEntryTypeKey,
  type PlatformKey,
} from "@/lib/constants";
import type { CalendarEntry } from "@/lib/db/schema";
import { markPublished, deleteEntry } from "@/lib/actions/calendar";

export function EntryChip({ entry, faded }: { entry: CalendarEntry; faded: boolean }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const typeMeta = CALENDAR_ENTRY_TYPES[entry.type as CalendarEntryTypeKey];
  const platformMeta = entry.platform ? PLATFORMS[entry.platform as PlatformKey] : null;

  function handlePublish() {
    startTransition(async () => {
      const res = await markPublished(entry.id);
      if (res.ok) {
        toast.success("Qeyd paylaşıldı kimi işarələndi");
        setOpen(false);
      } else {
        toast.error(res.error ?? "Xəta baş verdi");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteEntry(entry.id);
      if (res.ok) {
        toast.success("Qeyd silindi");
        setOpen(false);
      } else {
        toast.error(res.error ?? "Xəta baş verdi");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "block w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity hover:opacity-80",
          typeMeta?.color ?? "border-zinc-200 bg-zinc-100 text-zinc-700",
          faded && "opacity-40"
        )}
        title={entry.title}
      >
        {platformMeta && (
          <span className="mr-1" aria-hidden>
            {platformMeta.icon}
          </span>
        )}
        {entry.title}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{entry.title}</DialogTitle>
            <DialogDescription>{formatDate(entry.date)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              {typeMeta && (
                <Badge variant="outline" className={cn("border font-medium", typeMeta.color)}>
                  {typeMeta.label}
                </Badge>
              )}
              {entry.platform && <PlatformBadge platform={entry.platform} />}
              <Badge
                variant="outline"
                className={cn(
                  "border font-medium",
                  entry.status === "paylasilib"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
                )}
              >
                {entry.status === "paylasilib" ? "Paylaşılıb" : "Planlanıb"}
              </Badge>
            </div>
            {entry.note && (
              <div className="rounded-lg bg-zinc-50 p-3 text-zinc-600">{entry.note}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 data-icon="inline-start" />
              Sil
            </Button>
            {entry.status === "planlanib" && (
              <Button onClick={handlePublish} disabled={isPending}>
                <CheckCircle2 data-icon="inline-start" />
                Paylaşıldı işarələ
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
