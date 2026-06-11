"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, brandKit, contents, activities } from "@/lib/db/schema";
import { generatePlatformContent, qualityCheck } from "@/lib/ai/generate";
import type { PlatformKey, LanguageKey } from "@/lib/constants";

export interface QuickGenerateInput {
  productId: number;
  platform: PlatformKey;
  language: LanguageKey;
  tone: "standart" | "premium" | "genc";
  extraInstructions?: string;
}

export interface QuickGenerateResult {
  ok: boolean;
  error?: string;
  title?: string;
  body?: string;
  hashtags?: string[];
  seoKeywords?: string[];
  score?: number;
  issues?: string[];
}

export async function quickGenerate(input: QuickGenerateInput): Promise<QuickGenerateResult> {
  try {
    const product = db.select().from(products).where(eq(products.id, input.productId)).get();
    if (!product) {
      return { ok: false, error: "Məhsul tapılmadı" };
    }
    const brand = db.select().from(brandKit).limit(1).get() ?? null;

    const generated = await generatePlatformContent({
      product,
      brand,
      platform: input.platform,
      language: input.language,
      tone: input.tone,
      extraInstructions: input.extraInstructions?.trim() || undefined,
    });
    const quality = qualityCheck(generated, product, input.platform);

    return {
      ok: true,
      title: generated.title,
      body: generated.body,
      hashtags: generated.hashtags,
      seoKeywords: generated.seoKeywords,
      score: quality.score,
      issues: quality.issues,
    };
  } catch (err) {
    console.error("quickGenerate xətası:", err);
    return { ok: false, error: "Generasiya zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin." };
  }
}

export interface SaveAsContentInput {
  productId: number;
  platform: PlatformKey;
  language: LanguageKey;
  title: string;
  body: string;
  hashtags: string[];
  seoKeywords: string[];
  score: number;
  issues: string[];
}

export async function saveAsContent(
  input: SaveAsContentInput
): Promise<{ ok: boolean; id?: number; error?: string }> {
  try {
    if (!input.title.trim() || !input.body.trim()) {
      return { ok: false, error: "Başlıq və mətn boş ola bilməz" };
    }
    const product = db
      .select({ name: products.name })
      .from(products)
      .where(eq(products.id, input.productId))
      .get();
    if (!product) {
      return { ok: false, error: "Məhsul tapılmadı" };
    }

    const now = new Date().toISOString();
    const row = db
      .insert(contents)
      .values({
        productId: input.productId,
        platform: input.platform,
        language: input.language,
        title: input.title,
        body: input.body,
        hashtags: JSON.stringify(input.hashtags ?? []),
        seoKeywords: JSON.stringify(input.seoKeywords ?? []),
        status: "qaralama",
        qualityScore: input.score,
        qualityIssues: JSON.stringify(input.issues ?? []),
        generatedByAi: 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    db.insert(activities)
      .values({
        action: "AI Studio-da kontent yaradıb elan kimi yadda saxladı",
        target: product.name,
        createdAt: now,
      })
      .run();

    revalidatePath("/elanlar");
    revalidatePath("/");
    revalidatePath("/ai-studio");

    return { ok: true, id: row.id };
  } catch (err) {
    console.error("saveAsContent xətası:", err);
    return { ok: false, error: "Yadda saxlama zamanı xəta baş verdi" };
  }
}
