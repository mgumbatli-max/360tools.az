"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { activities, contents } from "@/lib/db/schema";
import {
  CONTENT_STATUSES,
  PLATFORMS,
  type ContentStatusKey,
  type PlatformKey,
} from "@/lib/constants";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// Hazırkı statusdan icazə verilən keçidlər
const ALLOWED_TRANSITIONS: Partial<Record<ContentStatusKey, ContentStatusKey[]>> = {
  qaralama: ["hazirdir"],
  hazirdir: ["tesdiq-gozleyir"],
  "tesdiq-gozleyir": ["yerlesdirildi", "qaralama"],
  xeta: ["hazirdir"],
};

function logActivity(action: string, target: string | null) {
  db.insert(activities)
    .values({
      memberId: 1,
      action,
      target,
      createdAt: new Date().toISOString(),
    })
    .run();
}

function contentLabel(content: { title: string; platform: string }): string {
  const platformLabel =
    PLATFORMS[content.platform as PlatformKey]?.label ?? content.platform;
  return `${content.title} (${platformLabel})`;
}

function revalidateContentPaths(id: number) {
  revalidatePath("/elanlar");
  revalidatePath(`/elanlar/${id}`);
}

export async function updateContentStatus(
  id: number,
  newStatus: ContentStatusKey
): Promise<ActionResult> {
  const content = db.select().from(contents).where(eq(contents.id, id)).get();
  if (!content) return { ok: false, error: "Elan tapılmadı" };

  const allowed = ALLOWED_TRANSITIONS[content.status as ContentStatusKey] ?? [];
  if (!allowed.includes(newStatus)) {
    return { ok: false, error: "Bu status keçidinə icazə verilmir" };
  }

  const now = new Date().toISOString();
  const patch: Partial<typeof contents.$inferInsert> = {
    status: newStatus,
    updatedAt: now,
  };
  if (newStatus === "yerlesdirildi") {
    patch.approvedById = 1;
    patch.publishedAt = now;
  }

  db.update(contents).set(patch).where(eq(contents.id, id)).run();

  logActivity(
    `Elanın statusunu "${CONTENT_STATUSES[newStatus].label}" etdi`,
    contentLabel(content)
  );
  revalidateContentPaths(id);
  return { ok: true };
}

export async function updateContent(
  id: number,
  data: { title: string; body: string; hashtags: string[] }
): Promise<ActionResult> {
  const content = db.select().from(contents).where(eq(contents.id, id)).get();
  if (!content) return { ok: false, error: "Elan tapılmadı" };

  const title = data.title.trim();
  const body = data.body.trim();
  if (!title) return { ok: false, error: "Başlıq boş ola bilməz" };
  if (!body) return { ok: false, error: "Mətn boş ola bilməz" };

  const hashtags = data.hashtags
    .map((tag) => tag.replace(/^#+/, "").trim())
    .filter(Boolean);

  db.update(contents)
    .set({
      title,
      body,
      hashtags: JSON.stringify(hashtags),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(contents.id, id))
    .run();

  logActivity("Elan mətnini redaktə etdi", contentLabel({ ...content, title }));
  revalidateContentPaths(id);
  return { ok: true };
}

export async function deleteContent(id: number): Promise<void> {
  const content = db.select().from(contents).where(eq(contents.id, id)).get();
  if (!content) {
    redirect("/elanlar");
  }

  db.delete(contents).where(eq(contents.id, id)).run();

  logActivity("Elanı sildi", contentLabel(content));
  revalidatePath("/elanlar");
  redirect("/elanlar");
}
