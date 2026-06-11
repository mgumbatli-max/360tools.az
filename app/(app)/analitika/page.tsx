import { Package, FileText, Gauge, Send } from "lucide-react";
import { eq } from "drizzle-orm";
import { format, subDays } from "date-fns";
import { az } from "date-fns/locale";
import { db } from "@/lib/db";
import { contents, products, activities, teamMembers } from "@/lib/db/schema";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_KEYS,
  PLATFORMS,
  PLATFORM_KEYS,
  type ContentStatusKey,
} from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  StatusPieChart,
  type StatusPieDatum,
} from "@/components/analytics/status-pie-chart";
import {
  HorizontalBarChart,
  type BarDatum,
} from "@/components/analytics/horizontal-bar-chart";
import { VerticalBarChart } from "@/components/analytics/vertical-bar-chart";
import { DailyAreaChart } from "@/components/analytics/daily-area-chart";

export const dynamic = "force-dynamic";

const STATUS_CHART_COLORS: Record<ContentStatusKey, string> = {
  qaralama: "#a1a1aa",
  hazirdir: "#3b82f6",
  "tesdiq-gozleyir": "#f59e0b",
  yerlesdirildi: "#10b981",
  xeta: "#ef4444",
};

function ChartCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">{children}</div>
      </CardContent>
    </Card>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
      {message}
    </div>
  );
}

export default function AnalyticsPage() {
  const contentRows = db
    .select({
      platform: contents.platform,
      status: contents.status,
      createdAt: contents.createdAt,
      qualityScore: contents.qualityScore,
    })
    .from(contents)
    .all();

  const productRows = db
    .select({ category: products.category })
    .from(products)
    .all();

  const activityRows = db
    .select({ memberName: teamMembers.name })
    .from(activities)
    .leftJoin(teamMembers, eq(activities.memberId, teamMembers.id))
    .all();

  // Ümumi göstəricilər
  const totalProducts = productRows.length;
  const totalContents = contentRows.length;
  const qualityScores = contentRows
    .map((c) => c.qualityScore)
    .filter((s): s is number => s != null);
  const avgQuality =
    qualityScores.length > 0
      ? Math.round(
          qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length
        )
      : null;
  const publishedCount = contentRows.filter(
    (c) => c.status === "yerlesdirildi"
  ).length;
  const publishRate =
    totalContents > 0 ? Math.round((publishedCount / totalContents) * 100) : 0;

  // (a) Status üzrə paylanma
  const statusData: StatusPieDatum[] = CONTENT_STATUS_KEYS.map((key) => ({
    name: CONTENT_STATUSES[key].label,
    value: contentRows.filter((c) => c.status === key).length,
    color: STATUS_CHART_COLORS[key],
  })).filter((d) => d.value > 0);

  // (b) Platforma üzrə kontent sayı
  const platformData: BarDatum[] = PLATFORM_KEYS.map((key) => ({
    name: PLATFORMS[key].label,
    value: contentRows.filter((c) => c.platform === key).length,
  })).filter((d) => d.value > 0);

  // (c) Son 14 gün üzrə yaradılan kontent
  const dayCounts = new Map<string, number>();
  for (const c of contentRows) {
    const key = c.createdAt.slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const now = new Date();
  const dailyData: BarDatum[] = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(now, 13 - i);
    return {
      name: format(day, "d MMM", { locale: az }),
      value: dayCounts.get(format(day, "yyyy-MM-dd")) ?? 0,
    };
  });

  // (d) Komanda məhsuldarlığı
  const memberCounts = new Map<string, number>();
  for (const a of activityRows) {
    const name = a.memberName ?? "Sistem";
    memberCounts.set(name, (memberCounts.get(name) ?? 0) + 1);
  }
  const teamData: BarDatum[] = [...memberCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // (e) Kateqoriya üzrə məhsul sayı
  const categoryCounts = new Map<string, number>();
  for (const p of productRows) {
    categoryCounts.set(p.category, (categoryCounts.get(p.category) ?? 0) + 1);
  }
  const categoryData: BarDatum[] = [...categoryCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <PageHeader
        title="Analitika"
        description="Kontent və komanda göstəricilərinin icmalı"
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Cəmi məhsul"
          value={totalProducts}
          icon={<Package className="size-5" />}
          accent="indigo"
        />
        <StatCard
          label="Cəmi kontent"
          value={totalContents}
          icon={<FileText className="size-5" />}
          accent="zinc"
        />
        <StatCard
          label="Orta keyfiyyət balı"
          value={avgQuality != null ? `${avgQuality} / 100` : "—"}
          hint={
            qualityScores.length > 0
              ? `${qualityScores.length} kontent üzrə`
              : "Hələ qiymətləndirilməyib"
          }
          icon={<Gauge className="size-5" />}
          accent="amber"
        />
        <StatCard
          label="Yerləşdirilmə faizi"
          value={`${publishRate}%`}
          hint={`${publishedCount} / ${totalContents} kontent`}
          icon={<Send className="size-5" />}
          accent="emerald"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Status üzrə kontent paylanması">
          {statusData.length > 0 ? (
            <StatusPieChart data={statusData} />
          ) : (
            <ChartEmpty message="Göstəriləcək kontent yoxdur" />
          )}
        </ChartCard>

        <ChartCard title="Platforma üzrə kontent sayı">
          {platformData.length > 0 ? (
            <HorizontalBarChart data={platformData} label="Kontent sayı" />
          ) : (
            <ChartEmpty message="Göstəriləcək kontent yoxdur" />
          )}
        </ChartCard>

        <ChartCard title="Son 14 gün üzrə yaradılan kontent" className="lg:col-span-2">
          <DailyAreaChart data={dailyData} label="Yaradılan kontent" />
        </ChartCard>

        <ChartCard title="Komanda məhsuldarlığı">
          {teamData.length > 0 ? (
            <VerticalBarChart
              data={teamData}
              color="#8b5cf6"
              label="Fəaliyyət sayı"
            />
          ) : (
            <ChartEmpty message="Hələ fəaliyyət qeydi yoxdur" />
          )}
        </ChartCard>

        <ChartCard title="Kateqoriya üzrə məhsul sayı">
          {categoryData.length > 0 ? (
            <HorizontalBarChart
              data={categoryData}
              color="#10b981"
              label="Məhsul sayı"
            />
          ) : (
            <ChartEmpty message="Hələ məhsul əlavə edilməyib" />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
