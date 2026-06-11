import { Badge } from "@/components/ui/badge";
import { PLATFORMS, type PlatformKey } from "@/lib/constants";

export function PlatformBadge({ platform }: { platform: string }) {
  const meta = PLATFORMS[platform as PlatformKey];
  if (!meta) return <Badge variant="secondary">{platform}</Badge>;
  return (
    <Badge variant="secondary" className="gap-1 font-medium">
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </Badge>
  );
}
