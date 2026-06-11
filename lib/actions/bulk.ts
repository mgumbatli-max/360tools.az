"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, contents, brandKit, activities, teamMembers } from "@/lib/db/schema";
import { generatePlatformContent, qualityCheck } from "@/lib/ai/generate";
import { getPlatform, getPlatforms } from "@/lib/platforms";
import { PLATFORM_KEYS, type LanguageKey, type ToneKey } from "@/lib/constants";

function nowIso(): string {
  return new Date().toISOString();
}

function logActivity(action: string, target?: string | null) {
  const member = db.select({ id: teamMembers.id }).from(teamMembers).limit(1).get();
  db.insert(activities)
    .values({ memberId: member?.id ?? null, action, target: target ?? null, createdAt: nowIso() })
    .run();
}

function toNum(v: string | undefined): number | null {
  if (v == null) return null;
  const cleaned = v.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export interface ImportRow {
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  price?: string;
  salePrice?: string;
  stock?: string;
  warranty?: string;
  color?: string;
  delivery?: string;
  note?: string;
  images?: string;
}

export async function importProducts(
  rows: ImportRow[]
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;
  const now = nowIso();
  const memberId =
    db.select({ id: teamMembers.id }).from(teamMembers).limit(1).get()?.id ?? null;

  rows.forEach((row, idx) => {
    const name = (row.name ?? "").trim();
    if (!name) {
      skipped += 1;
      errors.push(`${idx + 1}-ci sətir: ad boşdur, ötürüldü`);
      return;
    }
    const images = (row.images ?? "")
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    db.insert(products)
      .values({
        name,
        brand: (row.brand ?? "").trim() || null,
        model: (row.model ?? "").trim() || null,
        category: (row.category ?? "").trim() || "Digər",
        price: toNum(row.price),
        salePrice: toNum(row.salePrice),
        stock: toNum(row.stock) != null ? Math.round(toNum(row.stock)!) : null,
        warranty: (row.warranty ?? "").trim() || null,
        color: (row.color ?? "").trim() || null,
        delivery: (row.delivery ?? "").trim() || null,
        note: (row.note ?? "").trim() || null,
        specs: JSON.stringify([]),
        images: JSON.stringify(images),
        status: "aktiv",
        createdById: memberId,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    created += 1;
  });

  if (created > 0) {
    logActivity(`${created} məhsul idxal etdi (CSV)`, null);
    revalidatePath("/mehsullar");
    revalidatePath("/");
  }
  return { created, skipped, errors };
}

export interface BulkGenerateInput {
  productIds: number[];
  platforms: string[];
  language: LanguageKey;
  tone: ToneKey;
  skipExisting: boolean;
}

export interface BulkGenerateDetail {
  productName: string;
  platform: string;
  score: number;
}

export async function bulkGenerate(
  input: BulkGenerateInput
): Promise<{ created: number; skipped: number; details: BulkGenerateDetail[]; error?: string }> {
  const knownKeys = new Set<string>([
    ...getPlatforms().map((p) => p.key),
    ...(PLATFORM_KEYS as readonly string[]),
  ]);
  const platforms = input.platforms.filter((p) => knownKeys.has(p));
  if (platforms.length === 0) {
    return { created: 0, skipped: 0, details: [], error: "Ən azı bir platforma seçin" };
  }
  if (input.productIds.length === 0) {
    return { created: 0, skipped: 0, details: [], error: "Ən azı bir məhsul seçin" };
  }

  const brand = db.select().from(brandKit).limit(1).get() ?? null;
  const details: BulkGenerateDetail[] = [];
  let created = 0;
  let skipped = 0;
  const now = nowIso();

  for (const productId of input.productIds) {
    const product = db.select().from(products).where(eq(products.id, productId)).get();
    if (!product) continue;

    for (const platform of platforms) {
      if (input.skipExisting) {
        const exists = db
          .select({ id: contents.id })
          .from(contents)
          .where(and(eq(contents.productId, productId), eq(contents.platform, platform)))
          .get();
        if (exists) {
          skipped += 1;
          continue;
        }
      }

      try {
        const profile = getPlatform(platform) ?? null;
        const generated = await generatePlatformContent({
          product,
          brand,
          platform,
          profile,
          language: input.language,
          tone: input.tone,
        });
        const quality = qualityCheck(generated, product, platform, profile);
        db.insert(contents)
          .values({
            productId,
            platform,
            language: input.language,
            title: generated.title,
            body: generated.body,
            hashtags: JSON.stringify(generated.hashtags),
            seoKeywords: JSON.stringify(generated.seoKeywords),
            status: "qaralama",
            qualityScore: quality.score,
            qualityIssues: JSON.stringify(quality.issues),
            generatedByAi: 1,
            createdAt: now,
            updatedAt: now,
          })
          .run();
        created += 1;
        details.push({ productName: product.name, platform, score: quality.score });
      } catch (err) {
        console.error(`Toplu generasiya xətası (${productId}/${platform}):`, err);
      }
    }
  }

  if (created > 0) {
    logActivity(`Toplu generasiya: ${created} kontent yaratdı`, `${input.productIds.length} məhsul`);
    revalidatePath("/elanlar");
    revalidatePath("/mehsullar");
    revalidatePath("/");
  }
  return { created, skipped, details };
}
