"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { db } from "@/lib/db";
import { activities, products } from "@/lib/db/schema";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

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

function parseImages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function saveImages(productId: number, images: string[]) {
  db.update(products)
    .set({
      images: JSON.stringify(images),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, productId))
    .run();
}

function revalidateImagePaths() {
  revalidatePath("/sekiller");
  revalidatePath("/mehsullar");
}

export async function addImageUrl(
  productId: number,
  url: string
): Promise<ActionResult> {
  const trimmed = url?.trim();
  if (!trimmed) return { ok: false, error: "Şəkil URL-i boş ola bilməz" };
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
    return {
      ok: false,
      error: "Düzgün URL daxil edin (http:// və ya https:// ilə başlamalıdır)",
    };
  }

  const product = db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();
  if (!product) return { ok: false, error: "Məhsul tapılmadı" };

  const images = parseImages(product.images);
  if (images.includes(trimmed)) {
    return { ok: false, error: "Bu şəkil artıq məhsula əlavə olunub" };
  }

  images.push(trimmed);
  saveImages(productId, images);

  logActivity("məhsula şəkil əlavə etdi", product.name);
  revalidateImagePaths();
  return { ok: true };
}

export async function uploadImage(formData: FormData): Promise<ActionResult> {
  const productId = Number(formData.get("productId"));
  if (!productId || Number.isNaN(productId)) {
    return { ok: false, error: "Məhsul seçilməyib" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Fayl seçilməyib" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Yalnız şəkil faylları yüklənə bilər" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "Fayl ölçüsü 8 MB-dan böyük ola bilməz" };
  }

  const product = db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();
  if (!product) return { ok: false, error: "Məhsul tapılmadı" };

  // Fayl adını təhlükəsiz et: timestamp + sadələşdirilmiş ad
  const sanitized =
    file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "") || "sekil.jpg";
  const fileName = `${Date.now()}-${sanitized}`;

  // public/ qovluğuna runtime-da yazılan fayllar production-da servis olunmur —
  // data/uploads-da (Vercel-də /tmp) saxlanılır və /api/uploads/[name] route-u ilə verilir.
  const uploadsDir = process.env.VERCEL
    ? path.join("/tmp", "360tools-data", "uploads")
    : path.join(process.cwd(), "data", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, fileName), buffer);

  const urlPath = `/api/uploads/${fileName}`;
  const images = parseImages(product.images);
  images.push(urlPath);
  saveImages(productId, images);

  logActivity("məhsula şəkil yüklədi", product.name);
  revalidateImagePaths();
  return { ok: true };
}

/**
 * Müstəqil şəkil yükləməsi — heç bir məhsula bağlanmadan faylı saxlayır və URL qaytarır.
 * Sehrbaz kimi məhsul hələ yaradılmamış hallarda istifadə olunur.
 */
export async function uploadStandaloneImage(
  formData: FormData
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Fayl seçilməyib" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Yalnız şəkil faylları yüklənə bilər" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "Fayl ölçüsü 8 MB-dan böyük ola bilməz" };
  }

  const sanitized =
    file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "") || "sekil.jpg";
  const fileName = `${Date.now()}-${sanitized}`;

  // Vercel-də data/ read-only-dur — /tmp istifadə olunur (api/uploads route-u ilə eyni).
  const uploadsDir = process.env.VERCEL
    ? path.join("/tmp", "360tools-data", "uploads")
    : path.join(process.cwd(), "data", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, fileName), buffer);

  return { ok: true, url: `/api/uploads/${fileName}` };
}

export async function removeImage(
  productId: number,
  url: string
): Promise<ActionResult> {
  const product = db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();
  if (!product) return { ok: false, error: "Məhsul tapılmadı" };

  const images = parseImages(product.images);
  if (!images.includes(url)) {
    return { ok: false, error: "Şəkil tapılmadı" };
  }

  saveImages(
    productId,
    images.filter((item) => item !== url)
  );

  logActivity("məhsuldan şəkli sildi", product.name);
  revalidateImagePaths();
  return { ok: true };
}
