"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { activities, tasks, teamMembers } from "@/lib/db/schema";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TEAM_ROLES,
  type TaskPriorityKey,
  type TaskStatusKey,
  type TeamRoleKey,
} from "@/lib/constants";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

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

export async function addMember(input: {
  name: string;
  email?: string;
  role: TeamRoleKey;
  avatarColor?: string;
}): Promise<ActionResult> {
  const name = input.name?.trim();
  if (!name) return { ok: false, error: "Ad boş ola bilməz" };
  if (!TEAM_ROLES[input.role]) {
    return { ok: false, error: "Rol düzgün seçilməyib" };
  }

  db.insert(teamMembers)
    .values({
      name,
      email: input.email?.trim() || null,
      role: input.role,
      avatarColor: input.avatarColor || "#4f46e5",
      createdAt: new Date().toISOString(),
    })
    .run();

  logActivity("komandaya yeni üzv əlavə etdi", name);
  revalidatePath("/komanda");
  return { ok: true };
}

export async function createTask(input: {
  title: string;
  description?: string;
  assigneeId?: number | null;
  productId?: number | null;
  priority: TaskPriorityKey;
  dueDate?: string | null;
}): Promise<ActionResult> {
  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Başlıq boş ola bilməz" };
  if (!TASK_PRIORITIES[input.priority]) {
    return { ok: false, error: "Prioritet düzgün seçilməyib" };
  }

  db.insert(tasks)
    .values({
      title,
      description: input.description?.trim() || null,
      assigneeId: input.assigneeId ?? null,
      productId: input.productId ?? null,
      status: "gozleyir",
      priority: input.priority,
      dueDate: input.dueDate || null,
      createdAt: new Date().toISOString(),
    })
    .run();

  logActivity("yeni tapşırıq yaratdı", title);
  revalidatePath("/komanda");
  revalidatePath("/");
  return { ok: true };
}

export async function updateTaskStatus(
  id: number,
  status: TaskStatusKey
): Promise<ActionResult> {
  if (!TASK_STATUSES[status]) {
    return { ok: false, error: "Status düzgün seçilməyib" };
  }
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return { ok: false, error: "Tapşırıq tapılmadı" };

  db.update(tasks).set({ status }).where(eq(tasks.id, id)).run();

  logActivity(
    `tapşırığın statusunu "${TASK_STATUSES[status].label}" etdi`,
    task.title
  );
  revalidatePath("/komanda");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTask(id: number): Promise<ActionResult> {
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return { ok: false, error: "Tapşırıq tapılmadı" };

  db.delete(tasks).where(eq(tasks.id, id)).run();

  logActivity("tapşırığı sildi", task.title);
  revalidatePath("/komanda");
  revalidatePath("/");
  return { ok: true };
}
