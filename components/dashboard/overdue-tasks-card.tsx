import { PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TASK_PRIORITIES,
  formatDate,
  type TaskPriorityKey,
} from "@/lib/constants";
import { SectionCard } from "./section-card";

export interface OverdueTaskRow {
  id: number;
  title: string;
  priority: string;
  dueDate: string | null;
  assigneeName: string | null;
}

export function OverdueTasksCard({ items }: { items: OverdueTaskRow[] }) {
  return (
    <SectionCard title="Gecikən tapşırıqlar" href="/komanda">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <PartyPopper className="size-6 text-emerald-400" />
          <p className="text-sm text-zinc-500">Gecikən tapşırıq yoxdur — hər şey qaydasındadır</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {items.map((task) => {
            const priority = TASK_PRIORITIES[task.priority as TaskPriorityKey];
            return (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-900">
                    {task.title}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-zinc-500">
                    {task.assigneeName ?? "Təyin edilməyib"}
                    {task.dueDate && <> · Son tarix: {formatDate(task.dueDate)}</>}
                  </div>
                </div>
                {priority && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      priority.color
                    )}
                  >
                    {priority.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
