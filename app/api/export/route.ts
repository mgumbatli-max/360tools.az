import { NextRequest } from "next/server";
import { and, desc, eq, like, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { contents, products } from "@/lib/db/schema";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_KEYS,
  LANGUAGES,
  PLATFORMS,
  PLATFORM_KEYS,
  formatDate,
  type ContentStatusKey,
  type LanguageKey,
  type PlatformKey,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function parseHashtags(value: string | null): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((tag) => `#${String(tag)}`).join(" ")
      : "";
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const statusParam = sp.get("status") ?? undefined;
  const platformParam = sp.get("platform") ?? undefined;
  const languageParam = sp.get("language") ?? undefined;
  const q = sp.get("q")?.trim() || undefined;

  const status = CONTENT_STATUS_KEYS.includes(statusParam as ContentStatusKey)
    ? (statusParam as ContentStatusKey)
    : undefined;
  const platform = PLATFORM_KEYS.includes(platformParam as PlatformKey)
    ? (platformParam as PlatformKey)
    : undefined;
  const language = ["az", "ru", "en"].includes(languageParam ?? "")
    ? (languageParam as LanguageKey)
    : undefined;

  const filters: SQL[] = [];
  if (status) filters.push(eq(contents.status, status));
  if (platform) filters.push(eq(contents.platform, platform));
  if (language) filters.push(eq(contents.language, language));
  if (q) {
    const search = or(
      like(contents.title, `%${q}%`),
      like(products.name, `%${q}%`)
    );
    if (search) filters.push(search);
  }

  const rows = db
    .select({ content: contents, productName: products.name })
    .from(contents)
    .leftJoin(products, eq(contents.productId, products.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(contents.createdAt))
    .all();

  const header = [
    "Məhsul",
    "Platforma",
    "Dil",
    "Status",
    "Başlıq",
    "Mətn",
    "Hashtaglar",
    "Keyfiyyət balı",
    "Tarix",
  ];

  const lines = [
    header.map(csvEscape).join(","),
    ...rows.map(({ content, productName }) =>
      [
        productName ?? "",
        PLATFORMS[content.platform as PlatformKey]?.label ?? content.platform,
        LANGUAGES[content.language as LanguageKey]?.label ?? content.language,
        CONTENT_STATUSES[content.status as ContentStatusKey]?.label ??
          content.status,
        content.title,
        content.body,
        parseHashtags(content.hashtags),
        content.qualityScore ?? "",
        formatDate(content.createdAt),
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];

  // UTF-8 BOM — Excel faylı düzgün açsın deyə
  const csv = "\uFEFF" + lines.join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="elanlar.csv"',
      "Cache-Control": "no-store",
    },
  });
}
