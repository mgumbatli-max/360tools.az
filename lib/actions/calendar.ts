"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { addDays, format } from "date-fns";
import { db } from "@/lib/db";
import { calendarEntries, products, activities, teamMembers } from "@/lib/db/schema";
import { CALENDAR_ENTRY_TYPES, PLATFORMS, type CalendarEntryTypeKey } from "@/lib/constants";
import { getPlatforms } from "@/lib/platforms";

export interface CreateEntryInput {
  title: string;
  type: string;
  platform?: string | null;
  date: string; // YYYY-MM-DD
  note?: string | null;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createEntry(input: CreateEntryInput): Promise<ActionResult> {
  const title = input.title?.trim();
  if (!title) {
    return { ok: false, error: "Başlıq boş ola bilməz" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date ?? "")) {
    return { ok: false, error: "Tarix düzgün formatda deyil" };
  }
  if (!(input.type in CALENDAR_ENTRY_TYPES)) {
    return { ok: false, error: "Qeyd tipi düzgün seçilməyib" };
  }
  const platform = input.platform && input.platform in PLATFORMS ? input.platform : null;

  db.insert(calendarEntries)
    .values({
      title,
      type: input.type,
      platform,
      date: input.date,
      note: input.note?.trim() || null,
      status: "planlanib",
      createdAt: new Date().toISOString(),
    })
    .run();

  revalidatePath("/teqvim");
  return { ok: true };
}

export async function markPublished(id: number): Promise<ActionResult> {
  const entry = db.select().from(calendarEntries).where(eq(calendarEntries.id, id)).get();
  if (!entry) {
    return { ok: false, error: "Qeyd tapılmadı" };
  }
  db.update(calendarEntries)
    .set({ status: "paylasilib" })
    .where(eq(calendarEntries.id, id))
    .run();

  revalidatePath("/teqvim");
  return { ok: true };
}

export async function deleteEntry(id: number): Promise<ActionResult> {
  const entry = db.select().from(calendarEntries).where(eq(calendarEntries.id, id)).get();
  if (!entry) {
    return { ok: false, error: "Qeyd tapılmadı" };
  }
  db.delete(calendarEntries).where(eq(calendarEntries.id, id)).run();

  revalidatePath("/teqvim");
  return { ok: true };
}

export interface GeneratePlanInput {
  startDate: string; // YYYY-MM-DD
  days: number; // 14 | 30 | 60
  perWeek: number; // 3 | 5 | 7
  platforms: string[];
  skipExisting: boolean;
}

// Həftədə neçə paylaşım olacağına görə hansı həftə günlərinin seçiləcəyi
// (JS getDay: B=0, B.e=1, Ç.a=2, Ç=3, C.a=4, C=5, Ş=6)
const WEEKDAY_SETS: Record<number, number[]> = {
  3: [1, 3, 5],
  5: [1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export async function generatePlan(
  input: GeneratePlanInput
): Promise<{ created: number; skipped: number; error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
    return { created: 0, skipped: 0, error: "Başlanğıc tarix düzgün deyil" };
  }
  const days = [14, 30, 60].includes(input.days) ? input.days : 30;
  const perWeek = WEEKDAY_SETS[input.perWeek] ? input.perWeek : 5;
  const weekdays = new Set(WEEKDAY_SETS[perWeek]);

  const validPlatformKeys = new Set(getPlatforms({ enabledOnly: true }).map((p) => p.key));
  const platforms = input.platforms.filter((p) => validPlatformKeys.has(p));
  if (platforms.length === 0) {
    return { created: 0, skipped: 0, error: "Ən azı bir aktiv platforma seçin" };
  }

  const activeProducts = db.select().from(products).where(eq(products.status, "aktiv")).all();
  if (activeProducts.length === 0) {
    return { created: 0, skipped: 0, error: "Plan üçün aktiv məhsul lazımdır" };
  }
  const hasDiscount = activeProducts.some((p) => p.salePrice != null && p.price != null && p.salePrice < p.price);

  // Tip rotasiyası — endirim yalnız endirimli məhsul varsa daxil edilir
  const typeRotation: CalendarEntryTypeKey[] = hasDiscount
    ? ["yeni-mehsul", "post", "story", "endirim"]
    : ["yeni-mehsul", "post", "story"];

  const start = new Date(`${input.startDate}T00:00:00`);
  let created = 0;
  let skipped = 0;
  let i = 0; // rotasiya sayğacı
  const now = new Date().toISOString();

  for (let d = 0; d < days; d++) {
    const date = addDays(start, d);
    if (!weekdays.has(date.getDay())) continue;
    const dateStr = format(date, "yyyy-MM-dd");

    if (input.skipExisting) {
      const exists = db
        .select({ id: calendarEntries.id })
        .from(calendarEntries)
        .where(eq(calendarEntries.date, dateStr))
        .get();
      if (exists) {
        skipped += 1;
        continue;
      }
    }

    const product = activeProducts[i % activeProducts.length];
    const type = typeRotation[i % typeRotation.length];
    const platform = platforms[i % platforms.length];
    const typeLabel = CALENDAR_ENTRY_TYPES[type].label;

    db.insert(calendarEntries)
      .values({
        title: `${product.name} — ${typeLabel}`,
        type,
        platform,
        date: dateStr,
        status: "planlanib",
        createdAt: now,
      })
      .run();
    created += 1;
    i += 1;
  }

  if (created > 0) {
    const member = db.select({ id: teamMembers.id }).from(teamMembers).limit(1).get();
    db.insert(activities)
      .values({
        memberId: member?.id ?? null,
        action: `${days} günlük kontent planı yaratdı`,
        target: `${created} paylaşım`,
        createdAt: now,
      })
      .run();
  }

  revalidatePath("/teqvim");
  revalidatePath("/");
  return { created, skipped };
}
