import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { platforms, type Platform } from "@/lib/db/schema";
import { PLATFORMS, type PlatformKey } from "@/lib/constants";

/**
 * Platforma profilləri DB-dən oxunur (built-in + istifadəçinin əlavə etdikləri).
 * Yalnız server tərəfdə istifadə olunur; client komponentlərə serializable
 * meta (getPlatformMetaMap) və ya seçim siyahısı (getPlatformOptions) ötürülür.
 */

export function getPlatforms(opts?: { enabledOnly?: boolean }): Platform[] {
  const rows = db.select().from(platforms).orderBy(asc(platforms.sortOrder), asc(platforms.id)).all();
  return opts?.enabledOnly ? rows.filter((p) => p.enabled === 1) : rows;
}

export function getPlatform(key: string): Platform | undefined {
  return db.select().from(platforms).where(eq(platforms.key, key)).get();
}

export interface PlatformMeta {
  label: string;
  icon: string;
  grp: string;
}

/** Bütün platformaların (DB + konstant fallback) key → meta xəritəsi. Client props üçün serializable-dır. */
export function getPlatformMetaMap(): Record<string, PlatformMeta> {
  const map: Record<string, PlatformMeta> = {};
  for (const [key, meta] of Object.entries(PLATFORMS)) {
    map[key] = { label: meta.label, icon: meta.icon, grp: meta.group };
  }
  for (const p of getPlatforms()) {
    map[p.key] = { label: p.label, icon: p.icon ?? "📌", grp: p.grp };
  }
  return map;
}

export interface PlatformOption {
  key: string;
  label: string;
  icon: string;
  grp: string;
}

/** Select/checkbox siyahıları üçün aktiv platformalar. */
export function getPlatformOptions(): PlatformOption[] {
  return getPlatforms({ enabledOnly: true }).map((p) => ({
    key: p.key,
    label: p.label,
    icon: p.icon ?? "📌",
    grp: p.grp,
  }));
}

/** Köhnə kodla uyğunluq: DB-də profil yoxdursa konstantlardan istifadə olunur. */
export function isBuiltInKey(key: string): key is PlatformKey {
  return key in PLATFORMS;
}
