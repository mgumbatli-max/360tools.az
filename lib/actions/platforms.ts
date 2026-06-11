"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { platforms, products, brandKit, activities, teamMembers, type Platform } from "@/lib/db/schema";
import { getPlatform } from "@/lib/platforms";
import { generatePlatformContent, qualityCheck, type GeneratedContent } from "@/lib/ai/generate";
import type { LanguageKey } from "@/lib/constants";

function nowIso(): string {
  return new Date().toISOString();
}

function logActivity(action: string, target?: string | null) {
  const member = db.select({ id: teamMembers.id }).from(teamMembers).limit(1).get();
  db.insert(activities)
    .values({ memberId: member?.id ?? null, action, target: target ?? null, createdAt: nowIso() })
    .run();
}

/** Azərbaycan dilindəki adı təhlükəsiz slug-a çevirir. */
export async function slugify(input: string): Promise<string> {
  const map: Record<string, string> = {
    ə: "e", ı: "i", ö: "o", ü: "u", ğ: "g", ş: "s", ç: "c",
    Ə: "e", İ: "i", Ö: "o", Ü: "u", Ğ: "g", Ş: "s", Ç: "c",
  };
  return input
    .trim()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export interface PlatformFormValues {
  label: string;
  icon: string;
  grp: string;
  enabled: boolean;
  defaultLanguage: string;
  toneDefault: string;
  emojiLevel: string;
  titleMaxLen: number;
  bodyMinLen: number;
  bodyMaxLen: number;
  hashtagMin: number;
  hashtagMax: number;
  structure: string[];
  ctaText: string;
  contactFormat: string;
  forbiddenWords: string[];
  preferredPhrases: string[];
  extraInstructions: string;
  examples: string[];
  imageFormats: string[];
}

function num(v: number, fallback: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.round(v)) : fallback;
}

export async function createPlatform(input: {
  label: string;
  key: string;
  icon: string;
  grp: string;
}): Promise<{ error: string } | void> {
  const label = input.label.trim();
  if (!label) return { error: "Platforma adı boş ola bilməz" };

  let key = (await slugify(input.key || input.label)) || "platforma";
  // Unikallıq: mövcud açar varsa sona rəqəm əlavə et
  const existingKeys = new Set(db.select({ key: platforms.key }).from(platforms).all().map((r) => r.key));
  if (existingKeys.has(key)) {
    let i = 2;
    while (existingKeys.has(`${key}-${i}`)) i += 1;
    key = `${key}-${i}`;
  }

  const now = nowIso();
  db.insert(platforms)
    .values({
      key,
      label,
      icon: input.icon.trim() || "📌",
      grp: input.grp || "custom",
      isBuiltIn: 0,
      enabled: 1,
      sortOrder: 200,
      structure: JSON.stringify(["opener", "specs", "price", "warranty", "delivery", "cta"]),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logActivity("Yeni platforma əlavə etdi", label);
  revalidatePath("/platformalar");
  redirect(`/platformalar/${key}`);
}

export async function savePlatform(
  key: string,
  values: PlatformFormValues
): Promise<{ error: string } | void> {
  const existing = getPlatform(key);
  if (!existing) return { error: "Platforma tapılmadı" };

  const clean = {
    label: values.label.trim() || existing.label,
    icon: values.icon.trim() || "📌",
    grp: values.grp || existing.grp,
    enabled: values.enabled ? 1 : 0,
    defaultLanguage: values.defaultLanguage || "az",
    toneDefault: values.toneDefault || "standart",
    emojiLevel: values.emojiLevel || "light",
    titleMaxLen: num(values.titleMaxLen, 90),
    bodyMinLen: num(values.bodyMinLen, 60),
    bodyMaxLen: num(values.bodyMaxLen, 2200),
    hashtagMin: num(values.hashtagMin, 0),
    hashtagMax: num(values.hashtagMax, 10),
    structure: JSON.stringify(values.structure ?? []),
    ctaText: values.ctaText.trim() || null,
    contactFormat: values.contactFormat.trim() || null,
    forbiddenWords: JSON.stringify((values.forbiddenWords ?? []).map((w) => w.trim()).filter(Boolean)),
    preferredPhrases: JSON.stringify((values.preferredPhrases ?? []).map((w) => w.trim()).filter(Boolean)),
    extraInstructions: values.extraInstructions.trim() || null,
    examples: JSON.stringify((values.examples ?? []).map((e) => e.trim()).filter(Boolean)),
    imageFormats: JSON.stringify(values.imageFormats ?? []),
    updatedAt: nowIso(),
  };

  db.update(platforms).set(clean).where(eq(platforms.key, key)).run();
  logActivity("Platforma qaydalarını yenilədi", clean.label);
  revalidatePath("/platformalar");
  revalidatePath(`/platformalar/${key}`);
}

export async function toggleEnabled(key: string): Promise<void> {
  const existing = getPlatform(key);
  if (!existing) return;
  db.update(platforms)
    .set({ enabled: existing.enabled === 1 ? 0 : 1, updatedAt: nowIso() })
    .where(eq(platforms.key, key))
    .run();
  revalidatePath("/platformalar");
}

export async function deletePlatform(key: string): Promise<{ error: string } | void> {
  const existing = getPlatform(key);
  if (!existing) return { error: "Platforma tapılmadı" };
  if (existing.isBuiltIn === 1) {
    return { error: "Daxili platforma silinə bilməz — yalnız deaktiv edilə bilər" };
  }
  db.delete(platforms).where(eq(platforms.key, key)).run();
  logActivity("Platformanı sildi", existing.label);
  revalidatePath("/platformalar");
  redirect("/platformalar");
}

/** Cari form dəyərləri ilə nümunə məhsul üzərində kontent önizləməsi yaradır (DB-yə yazmadan). */
export async function previewContent(
  values: PlatformFormValues
): Promise<{ content: GeneratedContent; score: number; issues: string[] } | { error: string }> {
  const product = db.select().from(products).limit(1).get();
  if (!product) return { error: "Önizləmə üçün ən azı bir məhsul lazımdır" };
  const brand = db.select().from(brandKit).limit(1).get() ?? null;

  const profile = {
    id: 0,
    key: "preview",
    label: values.label || "Önizləmə",
    icon: values.icon || "📌",
    grp: values.grp || "custom",
    isBuiltIn: 0,
    enabled: 1,
    sortOrder: 0,
    toneDefault: values.toneDefault || "standart",
    emojiLevel: values.emojiLevel || "light",
    titleMaxLen: num(values.titleMaxLen, 90),
    bodyMinLen: num(values.bodyMinLen, 60),
    bodyMaxLen: num(values.bodyMaxLen, 2200),
    hashtagMin: num(values.hashtagMin, 0),
    hashtagMax: num(values.hashtagMax, 10),
    structure: JSON.stringify(values.structure ?? []),
    ctaText: values.ctaText || null,
    contactFormat: values.contactFormat || null,
    forbiddenWords: JSON.stringify(values.forbiddenWords ?? []),
    preferredPhrases: JSON.stringify(values.preferredPhrases ?? []),
    extraInstructions: values.extraInstructions || null,
    examples: JSON.stringify(values.examples ?? []),
    imageFormats: JSON.stringify(values.imageFormats ?? []),
    defaultLanguage: values.defaultLanguage || "az",
    createdAt: "",
    updatedAt: "",
  } satisfies Platform;

  const content = await generatePlatformContent({
    product,
    brand,
    platform: "preview",
    profile,
    language: (values.defaultLanguage as LanguageKey) ?? "az",
  });
  const quality = qualityCheck(content, product, "preview", profile);
  return { content, score: quality.score, issues: quality.issues };
}
