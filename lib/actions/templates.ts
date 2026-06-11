"use server";

import { revalidatePath } from "next/cache";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { templates, activities } from "@/lib/db/schema";

export interface TemplateInput {
  name: string;
  type: string;
  platform?: string | null;
  content: string;
  isDefault: boolean;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

function validate(input: TemplateInput): string | null {
  if (!input.name.trim()) return "Şablon adı boş ola bilməz";
  if (!input.type.trim()) return "Şablon tipi seçilməlidir";
  if (!input.content.trim()) return "Şablon mətni boş ola bilməz";
  return null;
}

function logActivity(action: string, target: string) {
  db.insert(activities)
    .values({
      memberId: 1,
      action,
      target,
      createdAt: new Date().toISOString(),
    })
    .run();
}

// Eyni tip üzrə yalnız bir standart şablon olsun
function clearOtherDefaults(type: string, exceptId: number) {
  db.update(templates)
    .set({ isDefault: 0 })
    .where(and(eq(templates.type, type), ne(templates.id, exceptId)))
    .run();
}

export async function createTemplate(input: TemplateInput): Promise<ActionResult> {
  const error = validate(input);
  if (error) return { success: false, error };

  const created = db
    .insert(templates)
    .values({
      name: input.name.trim(),
      type: input.type,
      platform: input.platform || null,
      content: input.content,
      isDefault: input.isDefault ? 1 : 0,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();

  if (input.isDefault) clearOtherDefaults(created.type, created.id);
  logActivity("yeni şablon yaratdı", created.name);
  revalidatePath("/sablonlar");
  return { success: true };
}

export async function updateTemplate(id: number, input: TemplateInput): Promise<ActionResult> {
  const error = validate(input);
  if (error) return { success: false, error };

  const existing = db.select().from(templates).where(eq(templates.id, id)).get();
  if (!existing) return { success: false, error: "Şablon tapılmadı" };

  db.update(templates)
    .set({
      name: input.name.trim(),
      type: input.type,
      platform: input.platform || null,
      content: input.content,
      isDefault: input.isDefault ? 1 : 0,
    })
    .where(eq(templates.id, id))
    .run();

  if (input.isDefault) clearOtherDefaults(input.type, id);
  logActivity("şablonu yenilədi", input.name.trim());
  revalidatePath("/sablonlar");
  return { success: true };
}

export async function deleteTemplate(id: number): Promise<ActionResult> {
  const existing = db.select().from(templates).where(eq(templates.id, id)).get();
  if (!existing) return { success: false, error: "Şablon tapılmadı" };

  db.delete(templates).where(eq(templates.id, id)).run();
  logActivity("şablonu sildi", existing.name);
  revalidatePath("/sablonlar");
  return { success: true };
}

export async function toggleDefault(id: number): Promise<ActionResult> {
  const existing = db.select().from(templates).where(eq(templates.id, id)).get();
  if (!existing) return { success: false, error: "Şablon tapılmadı" };

  const next = existing.isDefault ? 0 : 1;
  db.update(templates).set({ isDefault: next }).where(eq(templates.id, id)).run();
  if (next === 1) clearOtherDefaults(existing.type, id);

  revalidatePath("/sablonlar");
  return { success: true };
}
