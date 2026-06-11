import { cn } from "@/lib/utils";
import { CONTENT_STATUSES, type ContentStatusKey } from "@/lib/constants";

const DOTS: Record<ContentStatusKey, string> = {
  qaralama: "bg-zinc-400",
  hazirdir: "bg-blue-500",
  "tesdiq-gozleyir": "bg-amber-500",
  yerlesdirildi: "bg-emerald-500",
  xeta: "bg-red-500",
};

export function StatusBadge({ status }: { status: string }) {
  const meta = CONTENT_STATUSES[status as ContentStatusKey];
  if (!meta) {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        {status}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.color
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOTS[status as ContentStatusKey])} />
      {meta.label}
    </span>
  );
}
