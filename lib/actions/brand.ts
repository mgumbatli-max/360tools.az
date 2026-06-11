"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandKit, activities } from "@/lib/db/schema";

export interface BrandKitInput {
  businessName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontStyle: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  deliveryPolicy: string;
  warrantyPolicy: string;
  slogan: string;
  salesMessages: string[];
}

interface ActionResult {
  success: boolean;
  error?: string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export async function saveBrandKit(id: number, input: BrandKitInput): Promise<ActionResult> {
  if (!input.businessName.trim()) {
    return { success: false, error: "Biznes adı boş ola bilməz" };
  }
  if (input.primaryColor && !HEX_RE.test(input.primaryColor)) {
    return { success: false, error: "Əsas rəng düzgün hex formatında deyil (məs. #4f46e5)" };
  }
  if (input.secondaryColor && !HEX_RE.test(input.secondaryColor)) {
    return { success: false, error: "İkinci rəng düzgün hex formatında deyil (məs. #f59e0b)" };
  }

  const existing = db.select().from(brandKit).where(eq(brandKit.id, id)).get();
  if (!existing) return { success: false, error: "Brand kit tapılmadı" };

  const messages = input.salesMessages.map((m) => m.trim()).filter(Boolean);

  db.update(brandKit)
    .set({
      businessName: input.businessName.trim(),
      logoUrl: input.logoUrl.trim() || null,
      primaryColor: input.primaryColor || "#4f46e5",
      secondaryColor: input.secondaryColor || "#f59e0b",
      fontStyle: input.fontStyle.trim() || null,
      phone: input.phone.trim() || null,
      whatsapp: input.whatsapp.trim() || null,
      instagram: input.instagram.trim() || null,
      address: input.address.trim() || null,
      deliveryPolicy: input.deliveryPolicy.trim() || null,
      warrantyPolicy: input.warrantyPolicy.trim() || null,
      slogan: input.slogan.trim() || null,
      salesMessages: JSON.stringify(messages),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(brandKit.id, id))
    .run();

  db.insert(activities)
    .values({
      memberId: 1,
      action: "brend ayarlarını yenilədi",
      target: input.businessName.trim(),
      createdAt: new Date().toISOString(),
    })
    .run();

  revalidatePath("/ayarlar");
  return { success: true };
}
