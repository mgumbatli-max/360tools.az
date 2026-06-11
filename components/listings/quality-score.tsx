import { cn } from "@/lib/utils";

// Keyfiyyət balının vahid rəng hədləri: >=80 yaşıl, >=60 sarı, altı qırmızı.
// Bütün səhifələr bu helper-lərdən istifadə etməlidir.
export function qualityColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export function qualityBadgeClass(score: number): string {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (score >= 60) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-red-200 bg-red-50 text-red-700";
}

export function qualityBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function QualityScore({
  score,
  showMax = false,
}: {
  score: number | null;
  showMax?: boolean;
}) {
  if (score == null) return <span className="text-sm text-zinc-400">—</span>;
  return (
    <span className={cn("text-sm font-semibold tabular-nums", qualityColor(score))}>
      {score}
      {showMax && <span className="font-normal text-zinc-400">/100</span>}
    </span>
  );
}
