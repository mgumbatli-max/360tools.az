"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Loader2,
  MoreHorizontal,
  Package,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  formatDate,
  type TaskPriorityKey,
  type TaskStatusKey,
} from "@/lib/constants";
import { deleteTask, updateTaskStatus } from "@/lib/actions/team";

const STATUS_KEYS = Object.keys(TASK_STATUSES) as TaskStatusKey[];

export interface TaskCardData {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assigneeName: string | null;
  assigneeColor: string | null;
  productName: string | null;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TaskCard({ task }: { task: TaskCardData }) {
  const [isPending, startTransition] = useTransition();

  const priorityMeta = TASK_PRIORITIES[task.priority as TaskPriorityKey];
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue =
    !!task.dueDate &&
    task.dueDate.slice(0, 10) < today &&
    task.status !== "bitdi";

  function handleStatusChange(status: TaskStatusKey) {
    startTransition(async () => {
      const result = await updateTaskStatus(task.id, status);
      if (result.ok) {
        toast.success(`Status "${TASK_STATUSES[status].label}" olaraq dəyişdi`);
      } else {
        toast.error(result.error ?? "Xəta baş verdi");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.ok) {
        toast.success("Tapşırıq silindi");
      } else {
        toast.error(result.error ?? "Xəta baş verdi");
      }
    });
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-3 shadow-xs",
        isPending && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium leading-snug text-zinc-900">
          {task.title}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="-mt-0.5 -mr-1 shrink-0 text-zinc-400"
                aria-label="Tapşırıq əməliyyatları"
              />
            }
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <MoreHorizontal />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Statusu dəyiş</DropdownMenuLabel>
            {STATUS_KEYS.map((key) => (
              <DropdownMenuItem
                key={key}
                disabled={key === task.status}
                onClick={() => handleStatusChange(key)}
              >
                {TASK_STATUSES[key].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2 />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
          {task.description}
        </p>
      )}

      {task.productName && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
          <Package className="size-3.5 shrink-0 text-zinc-400" />
          <span className="truncate">{task.productName}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {task.assigneeName ? (
            <>
              <span
                className="flex size-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                style={{ backgroundColor: task.assigneeColor ?? "#4f46e5" }}
              >
                {initials(task.assigneeName)}
              </span>
              <span className="max-w-28 truncate text-xs text-zinc-600">
                {task.assigneeName}
              </span>
            </>
          ) : (
            <span className="text-xs text-zinc-400">Təyin edilməyib</span>
          )}
        </div>
        {priorityMeta && (
          <Badge variant="outline" className={cn("border", priorityMeta.color)}>
            {priorityMeta.label}
          </Badge>
        )}
      </div>

      {task.dueDate && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs",
            isOverdue ? "font-medium text-red-600" : "text-zinc-500"
          )}
        >
          <CalendarDays className="size-3.5 shrink-0" />
          {formatDate(task.dueDate)}
          {isOverdue && <span>· gecikib</span>}
        </div>
      )}
    </div>
  );
}
