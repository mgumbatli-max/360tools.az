import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "indigo" | "emerald" | "amber" | "red" | "violet" | "zinc";
  /** İsteğe bağlı trend göstəricisi, məs. "+12%". */
  trend?: { value: string; positive?: boolean };
}

const ACCENTS = {
  indigo: { icon: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-500" },
  violet: { icon: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  red: { icon: "bg-red-50 text-red-600", bar: "bg-red-500" },
  zinc: { icon: "bg-zinc-100 text-zinc-600", bar: "bg-zinc-400" },
} as const;

export function StatCard({ label, value, hint, icon, accent = "indigo", trend }: StatCardProps) {
  const a = ACCENTS[accent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-card">
      <span className={cn("absolute inset-x-0 top-0 h-0.5 opacity-70", a.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-muted-foreground">{label}</div>
          <div className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-foreground">
            {value}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold",
                  trend.positive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                )}
              >
                {trend.value}
              </span>
            )}
            {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
          </div>
        </div>
        {icon && (
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", a.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
