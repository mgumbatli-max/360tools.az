"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { calendarEntries } from "@/lib/db/schema";
import { CALENDAR_ENTRY_TYPES, PLATFORMS } from "@/lib/constants";

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
