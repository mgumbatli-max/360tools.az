import Link from "next/link";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { az } from "date-fns/locale";
import { and, asc, gte, lte } from "drizzle-orm";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { calendarEntries, type CalendarEntry } from "@/lib/db/schema";
import {
  CALENDAR_ENTRY_TYPES,
  formatDate,
  type CalendarEntryTypeKey,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { NewEntryDialog } from "@/components/calendar/new-entry-dialog";
import { GeneratePlanDialog } from "@/components/calendar/generate-plan-dialog";
import { EntryChip } from "@/components/calendar/entry-chip";
import { getPlatformOptions } from "@/lib/platforms";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string }>;
}) {
  const { ay } = await searchParams;
  const now = new Date();
  const monthParam =
    ay && /^\d{4}-(0[1-9]|1[0-2])$/.test(ay) ? ay : format(now, "yyyy-MM");
  const monthDate = new Date(`${monthParam}-01T00:00:00`);

  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const todayStr = format(now, "yyyy-MM-dd");
  const isCurrentMonth = monthParam === format(now, "yyyy-MM");

  const prevMonth = format(addMonths(monthDate, -1), "yyyy-MM");
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");
  const rawLabel = format(monthDate, "LLLL yyyy", { locale: az });
  const monthLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  const gridEntries = db
    .select()
    .from(calendarEntries)
    .where(
      and(
        gte(calendarEntries.date, format(gridStart, "yyyy-MM-dd")),
        lte(calendarEntries.date, format(gridEnd, "yyyy-MM-dd"))
      )
    )
    .orderBy(asc(calendarEntries.date), asc(calendarEntries.id))
    .all();

  const entriesByDate = new Map<string, CalendarEntry[]>();
  for (const entry of gridEntries) {
    const list = entriesByDate.get(entry.date) ?? [];
    list.push(entry);
    entriesByDate.set(entry.date, list);
  }

  const upcoming = db
    .select()
    .from(calendarEntries)
    .where(
      and(
        gte(calendarEntries.date, todayStr),
        lte(calendarEntries.date, format(addDays(now, 7), "yyyy-MM-dd"))
      )
    )
    .orderBy(asc(calendarEntries.date), asc(calendarEntries.id))
    .all();

  return (
    <div>
      <PageHeader
        title="Kontent təqvimi"
        description="Paylaşımları planla, izlə və vaxtında yerləşdir"
        icon={<CalendarDays className="size-5" />}
      >
        <GeneratePlanDialog
          defaultDate={isCurrentMonth ? format(addDays(now, 1), "yyyy-MM-dd") : `${monthParam}-01`}
          platforms={getPlatformOptions()}
        />
        <NewEntryDialog defaultDate={isCurrentMonth ? todayStr : `${monthParam}-01`} />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Əvvəlki ay"
            render={<Link href={`/teqvim?ay=${prevMonth}`} />}
          >
            <ChevronLeft />
          </Button>
          <Button variant="outline" render={<Link href="/teqvim" />}>
            Bu gün
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Növbəti ay"
            render={<Link href={`/teqvim?ay=${nextMonth}`} />}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <Card className="gap-0 py-0">
        <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/80">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-xs font-medium text-zinc-500"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEntries = entriesByDate.get(dateKey) ?? [];
            const inMonth = isSameMonth(day, monthDate);
            const isToday = dateKey === todayStr;
            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-28 border-b border-r border-zinc-100 p-1.5 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-zinc-50/60"
                )}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs",
                      isToday
                        ? "bg-indigo-600 font-semibold text-white"
                        : inMonth
                          ? "text-zinc-700"
                          : "text-zinc-400"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEntries.map((entry) => (
                    <EntryChip
                      key={entry.id}
                      entry={entry}
                      faded={entry.date < todayStr && entry.status === "paylasilib"}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-indigo-600" />
            Qarşıdan gələn 7 gün
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Qarşıdakı 7 gün üçün planlanmış paylaşım yoxdur.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {upcoming.map((entry) => {
                const typeMeta = CALENDAR_ENTRY_TYPES[entry.type as CalendarEntryTypeKey];
                return (
                  <li key={entry.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="w-28 shrink-0 text-sm text-zinc-500">
                      {formatDate(entry.date)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                      {entry.title}
                    </span>
                    {typeMeta && (
                      <Badge variant="outline" className={cn("border font-medium", typeMeta.color)}>
                        {typeMeta.label}
                      </Badge>
                    )}
                    {entry.platform && <PlatformBadge platform={entry.platform} />}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        entry.status === "paylasilib" ? "text-emerald-600" : "text-zinc-400"
                      )}
                    >
                      {entry.status === "paylasilib" ? "Paylaşılıb" : "Planlanıb"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
