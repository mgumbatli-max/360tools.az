import {
  Sparkles,
  Send,
  Clock3,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contents,
  products,
  activities,
  teamMembers,
  tasks,
} from "@/lib/db/schema";
import { PLATFORM_KEYS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  PlatformStatusCard,
  type PlatformStatusRow,
} from "@/components/dashboard/platform-status-card";
import { PendingContentCard } from "@/components/dashboard/pending-content-card";
import { ActivityCard } from "@/components/dashboard/activity-card";
import { OverdueTasksCard } from "@/components/dashboard/overdue-tasks-card";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  // Kontent statistikası
  const contentRows = db
    .select({
      platform: contents.platform,
      status: contents.status,
      createdAt: contents.createdAt,
    })
    .from(contents)
    .all();

  const todayCount = contentRows.filter(
    (c) => c.createdAt.slice(0, 10) === today
  ).length;
  const statusCounts: Record<string, number> = {};
  for (const c of contentRows) {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
  }

  // Platforma üzrə breakdown
  const platformMap = new Map<string, PlatformStatusRow>();
  for (const c of contentRows) {
    const row =
      platformMap.get(c.platform) ??
      ({ platform: c.platform, total: 0, counts: {} } as PlatformStatusRow);
    row.total += 1;
    row.counts[c.status] = (row.counts[c.status] ?? 0) + 1;
    platformMap.set(c.platform, row);
  }
  const knownKeys = PLATFORM_KEYS as readonly string[];
  const platformRows: PlatformStatusRow[] = [
    ...knownKeys.filter((k) => platformMap.has(k)).map((k) => platformMap.get(k)!),
    ...[...platformMap.values()].filter((r) => !knownKeys.includes(r.platform)),
  ];

  // Təsdiq gözləyən kontentlər (məhsul adı ilə)
  const pendingItems = db
    .select({
      id: contents.id,
      title: contents.title,
      platform: contents.platform,
      productName: products.name,
    })
    .from(contents)
    .leftJoin(products, eq(contents.productId, products.id))
    .where(eq(contents.status, "tesdiq-gozleyir"))
    .orderBy(desc(contents.createdAt))
    .limit(8)
    .all();

  // Son fəaliyyət
  const recentActivities = db
    .select({
      id: activities.id,
      action: activities.action,
      target: activities.target,
      createdAt: activities.createdAt,
      memberName: teamMembers.name,
      avatarColor: teamMembers.avatarColor,
    })
    .from(activities)
    .leftJoin(teamMembers, eq(activities.memberId, teamMembers.id))
    .orderBy(desc(activities.createdAt), desc(activities.id))
    .limit(8)
    .all();

  // Gecikən tapşırıqlar
  const allTasks = db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      assigneeName: teamMembers.name,
    })
    .from(tasks)
    .leftJoin(teamMembers, eq(tasks.assigneeId, teamMembers.id))
    .all();
  const overdueTasks = allTasks.filter(
    (t) =>
      t.status === "gecikir" ||
      (t.status !== "bitdi" && t.dueDate != null && t.dueDate.slice(0, 10) < today)
  );

  return (
    <div>
      <PageHeader
        title="İdarə paneli"
        description="Kontent əməliyyatlarının ümumi görünüşü"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Bu gün yaradılan"
          value={todayCount}
          hint="kontent"
          icon={<Sparkles className="size-5" />}
          accent="indigo"
        />
        <StatCard
          label="Yerləşdirilmiş kontent"
          value={statusCounts["yerlesdirildi"] ?? 0}
          icon={<Send className="size-5" />}
          accent="emerald"
        />
        <StatCard
          label="Təsdiq gözləyən"
          value={statusCounts["tesdiq-gozleyir"] ?? 0}
          icon={<Clock3 className="size-5" />}
          accent="amber"
        />
        <StatCard
          label="Qaralama"
          value={statusCounts["qaralama"] ?? 0}
          icon={<FileText className="size-5" />}
          accent="zinc"
        />
        <StatCard
          label="Xəta verən"
          value={statusCounts["xeta"] ?? 0}
          icon={<AlertTriangle className="size-5" />}
          accent="red"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PlatformStatusCard rows={platformRows} />
        <PendingContentCard items={pendingItems} />
        <ActivityCard items={recentActivities} />
        <OverdueTasksCard items={overdueTasks} />
      </div>
    </div>
  );
}
