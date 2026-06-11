"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  products,
  contents,
  activities,
  brandKit,
  teamMembers,
} from "@/lib/db/schema";
import { generatePlatformContent, qualityCheck } from "@/lib/ai/generate";
import {
  PLATFORM_KEYS,
  type PlatformKey,
  type LanguageKey,
} from "@/lib/constants";

export interface SpecRow {
  name: string;
  value: string;
}

export interface ProductFormValues {
  name: string;
  brand: string;
  model: string;
  category: string;
  price: number | null;
  salePrice: number | null;
  stock: number | null;
  warranty: string;
  color: string;
  size: string;
  delivery: string;
  note: string;
  images: string[];
  specs: SpecRow[];
}

export interface GenerateContentsInput {
  productId: number;
  platforms: string[];
  language: LanguageKey;
  tone: "standart" | "premium" | "genc";
}

function nowIso(): string {
  return new Date().toISOString();
}

function firstMemberId(): number | null {
  const member = db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .limit(1)
    .get();
  return member?.id ?? null;
}

function logActivity(action: string, target?: string | null) {
  db.insert(activities)
    .values({
      memberId: firstMemberId(),
      action,
      target: target ?? null,
      createdAt: nowIso(),
    })
    .run();
}

function sanitizeValues(values: ProductFormValues) {
  const specs = (values.specs ?? [])
    .map((s) => ({ name: s.name.trim(), value: s.value.trim() }))
    .filter((s) => s.name.length > 0 && s.value.length > 0);
  const images = (values.images ?? []).map((i) => i.trim()).filter(Boolean);

  return {
    name: values.name.trim(),
    brand: values.brand.trim() || null,
    model: values.model.trim() || null,
    category: values.category.trim() || "Digər",
    price: values.price,
    salePrice: values.salePrice,
    stock: values.stock,
    warranty: values.warranty.trim() || null,
    color: values.color.trim() || null,
    size: values.size.trim() || null,
    delivery: values.delivery.trim() || null,
    note: values.note.trim() || null,
    specs: JSON.stringify(specs),
    images: JSON.stringify(images),
  };
}

export async function createProduct(
  values: ProductFormValues
): Promise<{ error: string } | void> {
  if (!values.name || values.name.trim().length === 0) {
    return { error: "Məhsulun adı boş ola bilməz" };
  }

  const data = sanitizeValues(values);
  const now = nowIso();

  const inserted = db
    .insert(products)
    .values({
      ...data,
      status: "aktiv",
      createdById: firstMemberId(),
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: products.id })
    .get();

  logActivity("Yeni məhsul əlavə etdi", data.name);
  revalidatePath("/mehsullar");
  revalidatePath("/");
  redirect(`/mehsullar/${inserted.id}`);
}

export async function updateProduct(
  id: number,
  values: ProductFormValues
): Promise<{ error: string } | void> {
  if (!values.name || values.name.trim().length === 0) {
    return { error: "Məhsulun adı boş ola bilməz" };
  }

  const existing = db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) {
    return { error: "Məhsul tapılmadı" };
  }

  const data = sanitizeValues(values);
  db.update(products)
    .set({ ...data, updatedAt: nowIso() })
    .where(eq(products.id, id))
    .run();

  logActivity("Məhsul məlumatlarını yenilədi", data.name);
  revalidatePath("/mehsullar");
  revalidatePath(`/mehsullar/${id}`);
  revalidatePath("/");
  redirect(`/mehsullar/${id}`);
}

export async function deleteProduct(
  id: number
): Promise<{ error: string } | void> {
  const existing = db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) {
    return { error: "Məhsul tapılmadı" };
  }

  db.delete(contents).where(eq(contents.productId, id)).run();
  db.delete(products).where(eq(products.id, id)).run();

  logActivity("Məhsulu sildi", existing.name);
  revalidatePath("/mehsullar");
  revalidatePath("/elanlar");
  revalidatePath("/");
}

export async function toggleArchive(
  id: number
): Promise<{ error: string } | void> {
  const existing = db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) {
    return { error: "Məhsul tapılmadı" };
  }

  const newStatus = existing.status === "aktiv" ? "arxiv" : "aktiv";
  db.update(products)
    .set({ status: newStatus, updatedAt: nowIso() })
    .where(eq(products.id, id))
    .run();

  logActivity(
    newStatus === "arxiv" ? "Məhsulu arxivlədi" : "Məhsulu aktivləşdirdi",
    existing.name
  );
  revalidatePath("/mehsullar");
  revalidatePath(`/mehsullar/${id}`);
  revalidatePath("/");
}

export async function generateContents(
  input: GenerateContentsInput
): Promise<{ created: number; error?: string }> {
  const validPlatforms = input.platforms.filter((p): p is PlatformKey =>
    (PLATFORM_KEYS as readonly string[]).includes(p)
  );
  if (validPlatforms.length === 0) {
    return { created: 0, error: "Ən azı bir platforma seçin" };
  }

  const product = db
    .select()
    .from(products)
    .where(eq(products.id, input.productId))
    .get();
  if (!product) {
    return { created: 0, error: "Məhsul tapılmadı" };
  }

  const brand = db.select().from(brandKit).limit(1).get() ?? null;

  let created = 0;
  const failures: string[] = [];

  for (const platform of validPlatforms) {
    try {
      const generated = await generatePlatformContent({
        product,
        brand,
        platform,
        language: input.language,
        tone: input.tone,
      });
      const quality = qualityCheck(generated, product, platform);
      const now = nowIso();

      db.insert(contents)
        .values({
          productId: product.id,
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
    } catch (err) {
      console.error(`Kontent generasiya xətası (${platform}):`, err);
      failures.push(platform);
    }
  }

  if (created > 0) {
    logActivity(
      `AI ilə ${created} platforma üçün kontent yaratdı`,
      product.name
    );
  }

  revalidatePath(`/mehsullar/${product.id}`);
  revalidatePath("/mehsullar");
  revalidatePath("/elanlar");
  revalidatePath("/");

  if (failures.length > 0) {
    return {
      created,
      error: `${failures.length} platforma üçün kontent yaradıla bilmədi`,
    };
  }
  return { created };
}
