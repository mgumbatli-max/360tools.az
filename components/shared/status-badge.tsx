import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CONTENT_STATUSES, type ContentStatusKey } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const meta = CONTENT_STATUSES[status as ContentStatusKey];
  if (!meta) return <Badge variant="outline">{status}</Badge>;
  return (
    <Badge variant="outline" className={cn("border font-medium", meta.color)}>
      {meta.label}
    </Badge>
  );
}
