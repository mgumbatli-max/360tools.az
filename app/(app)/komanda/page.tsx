import { Mail, Activity as ActivityIcon, ClipboardList } from "lucide-react";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { activities, products, tasks, teamMembers } from "@/lib/db/schema";
import {
  TASK_STATUSES,
  TEAM_ROLES,
  type TaskStatusKey,
  type TeamRoleKey,
} from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddMemberDialog } from "@/components/team/add-member-dialog";
import { NewTaskDialog } from "@/components/team/new-task-dialog";
import { TaskCard, type TaskCardData } from "@/components/team/task-card";

export const dynamic = "force-dynamic";

const STATUS_KEYS = Object.keys(TASK_STATUSES) as TaskStatusKey[];

const COLUMN_DOT_COLORS: Record<TaskStatusKey, string> = {
  gozleyir: "bg-zinc-400",
  icrada: "bg-blue-500",
  bitdi: "bg-emerald-500",
  gecikir: "bg-red-500",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function TeamPage() {
  const members = db
    .select()
    .from(teamMembers)
    .orderBy(teamMembers.createdAt)
    .all();

  const activityCounts = db
    .select({ memberId: activities.memberId, total: count() })
    .from(activities)
    .groupBy(activities.memberId)
    .all();
  const activityMap = new Map<number, number>();
  for (const row of activityCounts) {
    if (row.memberId != null) activityMap.set(row.memberId, row.total);
  }

  const taskRows: TaskCardData[] = db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      assigneeName: teamMembers.name,
      assigneeColor: teamMembers.avatarColor,
      productName: products.name,
    })
    .from(tasks)
    .leftJoin(teamMembers, eq(tasks.assigneeId, teamMembers.id))
    .leftJoin(products, eq(tasks.productId, products.id))
    .orderBy(desc(tasks.createdAt))
    .all();

  const memberOptions = members.map((member) => ({
    id: member.id,
    name: member.name,
  }));
  const productOptions = db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(eq(products.status, "aktiv"))
    .orderBy(products.name)
    .all();

  return (
    <div>
      <PageHeader
        title="Komanda"
        description="Komanda üzvləri, rollar və tapşırıq lövhəsi"
      >
        <NewTaskDialog members={memberOptions} products={productOptions} />
        <AddMemberDialog />
      </PageHeader>

      {/* Üzv kartları */}
      {members.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon className="size-8" />}
          title="Komanda üzvü yoxdur"
          description="İlk üzvü əlavə etmək üçün yuxarıdakı düymədən istifadə edin."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member) => {
            const roleLabel =
              TEAM_ROLES[member.role as TeamRoleKey]?.label ?? member.role;
            const activityCount = activityMap.get(member.id) ?? 0;
            return (
              <Card key={member.id} className="py-0">
                <CardContent className="flex items-start gap-3 p-4">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: member.avatarColor ?? "#4f46e5" }}
                  >
                    {initials(member.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900">
                      {member.name}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {roleLabel}
                    </Badge>
                    {member.email && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-zinc-500">
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                      <ActivityIcon className="size-3 shrink-0" />
                      {activityCount} fəaliyyət
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tapşırıq lövhəsi */}
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="size-4 text-zinc-400" />
          <h2 className="text-base font-semibold text-zinc-900">
            Tapşırıq lövhəsi
          </h2>
          <span className="text-sm text-zinc-400">({taskRows.length})</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_KEYS.map((statusKey) => {
            const columnTasks = taskRows.filter(
              (task) => task.status === statusKey
            );
            return (
              <div
                key={statusKey}
                className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3"
              >
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span
                    className={`size-2 rounded-full ${COLUMN_DOT_COLORS[statusKey]}`}
                  />
                  <span className="text-sm font-medium text-zinc-700">
                    {TASK_STATUSES[statusKey].label}
                  </span>
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs text-zinc-500 ring-1 ring-zinc-200">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {columnTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-400">
                      Tapşırıq yoxdur
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
