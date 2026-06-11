import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "indigo" | "emerald" | "amber" | "red" | "zinc";
}

const ACCENTS = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  zinc: "bg-zinc-100 text-zinc-600",
} as const;

export function StatCard({ label, value, hint, icon, accent = "indigo" }: StatCardProps) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-4 p-5">
        {icon && (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", ACCENTS[accent])}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm text-zinc-500">{label}</div>
          <div className="text-2xl font-semibold tracking-tight text-zinc-900">{value}</div>
          {hint && <div className="mt-0.5 truncate text-xs text-zinc-400">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
