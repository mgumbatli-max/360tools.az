import { Badge } from "@/components/ui/badge";
import { PLATFORMS, type PlatformKey } from "@/lib/constants";

interface PlatformBadgeProps {
  platform: string;
  /** Custom platformalar üçün DB-dən gələn etiket — verilməsə konstantlardan axtarılır. */
  label?: string;
  icon?: string;
}

export function PlatformBadge({ platform, label, icon }: PlatformBadgeProps) {
  const meta = PLATFORMS[platform as PlatformKey];
  const finalLabel = label ?? meta?.label;
  const finalIcon = icon ?? meta?.icon;
  if (!finalLabel) return <Badge variant="secondary">{platform}</Badge>;
  return (
    <Badge variant="secondary" className="gap-1 font-medium">
      {finalIcon && <span aria-hidden>{finalIcon}</span>}
      {finalLabel}
    </Badge>
  );
}
