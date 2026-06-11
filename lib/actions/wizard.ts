"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, contents, brandKit, activities, teamMembers } from "@/lib/db/schema";
import { generatePlatformContent, qualityCheck } from "@/lib/ai/generate";
import { getPlatform, getPlatforms } from "@/lib/platforms";
import { PLATFORM_KEYS, type LanguageKey, type ToneKey } from "@/lib/constants";

function nowIso(): string {
  return new Date().toISOString();
}

function firstMemberId(): number | null {
  return db.select({ id: teamMembers.id }).from(teamMembers).limit(1).get()?.id ?? null;
}

export interface WizardResult {
  platform: string;
  platformLabel: string;
  platformIcon: string;
  title: string;
  body: string;
  hashtags: string[];
  score: number;
}

export interface WizardInput {
  name: string;
  price: number | null;
  salePrice: number | null;
  note: string;
  images: string[];
  platforms: string[];
  language: LanguageKey;
  tone: ToneKey;
}

/**
 * Sehrbazın əsas əməliyyatı: bir məhsul yaradır və seçilmiş platformalar üçün
 * kontent generasiya edib qaralama kimi saxlayır. Nəticələri göstərmək üçün qaytarır.
 */
export async function createAndGenerate(
  input: WizardInput
): Promise<{ productId: number; results: WizardResult[] } | { error: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Məhsulun adını yazın" };

  const allPlatforms = getPlatforms({ enabledOnly: true });
  const knownKeys = new Set<string>([...allPlatforms.map((p) => p.key), ...(PLATFORM_KEYS as readonly string[])]);
  const platforms = input.platforms.filter((p) => knownKeys.has(p));
  if (platforms.length === 0) return { error: "Ən azı bir platforma seçin" };

  const now = nowIso();
  const memberId = firstMemberId();
  const images = input.images.map((i) => i.trim()).filter(Boolean);

  const inserted = db
    .insert(products)
    .values({
      name,
      category: "Digər",
      price: input.price,
      salePrice: input.salePrice,
      note: input.note.trim() || null,
      specs: JSON.stringify([]),
      images: JSON.stringify(images),
      status: "aktiv",
      createdById: memberId,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: products.id })
    .get();

  const product = db.select().from(products).where(eq(products.id, inserted.id)).get()!;
  const brand = db.select().from(brandKit).limit(1).get() ?? null;

  const results: WizardResult[] = [];
  for (const key of platforms) {
    try {
      const profile = getPlatform(key) ?? null;
      const generated = await generatePlatformContent({
        product,
        brand,
        platform: key,
        profile,
        language: input.language,
        tone: input.tone,
      });
      const quality = qualityCheck(generated, product, key, profile);
      db.insert(contents)
        .values({
          productId: product.id,
          platform: key,
          language: input.language,
          title: generated.title,
          body: generated.body,
          hashtags: JSON.stringify(generated.hashtags),
          seoKeywords: JSON.stringify(generated.seoKeywords),
          status: "qaralama",
          qualityScore: quality.score,
          qualityIssues: JSON.stringify(quality.issues),
          generatedByAi: 1,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        })
        .run();
      results.push({
        platform: key,
        platformLabel: profile?.label ?? key,
        platformIcon: profile?.icon ?? "📌",
        title: generated.title,
        body: generated.body,
        hashtags: generated.hashtags,
        score: quality.score,
      });
    } catch (err) {
      console.error(`Sehrbaz generasiya xətası (${key}):`, err);
    }
  }

  db.insert(activities)
    .values({
      memberId,
      action: `Sehrbazla ${results.length} kontent yaratdı`,
      target: name,
      createdAt: nowIso(),
    })
    .run();

  revalidatePath("/");
  revalidatePath("/mehsullar");
  revalidatePath("/elanlar");

  return { productId: product.id, results };
}
