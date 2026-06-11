import Link from "next/link";
import { Bot, FileDown, Megaphone } from "lucide-react";
import { and, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { contents, products } from "@/lib/db/schema";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_KEYS,
  PLATFORM_KEYS,
  formatDate,
  type ContentStatusKey,
  type LanguageKey,
  type PlatformKey,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterPill } from "@/components/shared/filter-pills";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ListingsFilters } from "@/components/listings/listings-filters";
import { QualityScore } from "@/components/listings/quality-score";

export const dynamic = "force-dynamic";

interface ElanlarSearchParams {
  status?: string;
  platform?: string;
  language?: string;
  q?: string;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default async function ElanlarPage({
  searchParams,
}: {
  searchParams: Promise<ElanlarSearchParams>;
}) {
  const sp = await searchParams;

  const status = CONTENT_STATUS_KEYS.includes(sp.status as ContentStatusKey)
    ? (sp.status as ContentStatusKey)
    : undefined;
  const platform = PLATFORM_KEYS.includes(sp.platform as PlatformKey)
    ? (sp.platform as PlatformKey)
    : undefined;
  const language = ["az", "ru", "en"].includes(sp.language ?? "")
    ? (sp.language as LanguageKey)
    : undefined;
  const q = sp.q?.trim() || undefined;

  // Status xaricindəki filterlər (tab sayları da bunlara hörmət edir)
  const baseFilters: SQL[] = [];
  if (platform) baseFilters.push(eq(contents.platform, platform));
  if (language) baseFilters.push(eq(contents.language, language));
  if (q) {
    const search = or(
      like(contents.title, `%${q}%`),
      like(products.name, `%${q}%`)
    );
    if (search) baseFilters.push(search);
  }

  const filters = [...baseFilters];
  if (status) filters.push(eq(contents.status, status));

  const rows = db
    .select({ content: contents, productName: products.name })
    .from(contents)
    .leftJoin(products, eq(contents.productId, products.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(contents.createdAt))
    .all();

  const countRows = db
    .select({ status: contents.status, value: count() })
    .from(contents)
    .leftJoin(products, eq(contents.productId, products.id))
    .where(baseFilters.length ? and(...baseFilters) : undefined)
    .groupBy(contents.status)
    .all();

  const countsByStatus = new Map(countRows.map((row) => [row.status, row.value]));
  const total = countRows.reduce((sum, row) => sum + row.value, 0);

  const tabs: { key: ContentStatusKey | ""; label: string; tabCount: number }[] = [
    { key: "", label: "Hamısı", tabCount: total },
    ...CONTENT_STATUS_KEYS.map((key) => ({
      key,
      label: CONTENT_STATUSES[key].label,
      tabCount: countsByStatus.get(key) ?? 0,
    })),
  ];

  const exportHref = `/api/export${buildQuery({ status, platform, language, q })}`;

  return (
    <div>
      <PageHeader
        title="Elanlar"
        description="Yaradılmış kontentlərin idarəetməsi və təsdiq prosesi"
      >
        <a href={exportHref} className={cn(buttonVariants({ variant: "outline" }))}>
          <FileDown className="size-4" />
          CSV-yə ixrac
        </a>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <FilterPill
            key={tab.key || "hamisi"}
            href={`/elanlar${buildQuery({
              status: tab.key || undefined,
              platform,
              language,
              q,
            })}`}
            active={(status ?? "") === tab.key}
            label={tab.label}
            count={tab.tabCount}
          />
        ))}
      </div>

      <ListingsFilters platform={platform} language={language} q={q} />

      {rows.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-10" />}
          title="Elan tapılmadı"
          description="Seçilmiş filtrlərə uyğun kontent yoxdur. Filtri dəyişin və ya AI Studio-da yeni kontent yaradın."
        />
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlıq</TableHead>
                  <TableHead>Məhsul</TableHead>
                  <TableHead>Platforma</TableHead>
                  <TableHead>Dil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Keyfiyyət</TableHead>
                  <TableHead className="text-right">Tarix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ content, productName }) => (
                  <TableRow key={content.id}>
                    <TableCell className="max-w-72">
                      <Link
                        href={`/elanlar/${content.id}`}
                        className="flex items-center gap-1.5 font-medium text-zinc-900 hover:text-indigo-600 hover:underline"
                      >
                        <span className="truncate">{content.title}</span>
                        {content.generatedByAi === 1 && (
                          <Bot
                            className="size-3.5 shrink-0 text-indigo-400"
                            aria-label="AI ilə yaradılıb"
                          />
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-zinc-600">
                      {productName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <PlatformBadge platform={content.platform} />
                    </TableCell>
                    <TableCell className="uppercase text-zinc-500">
                      {content.language}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={content.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <QualityScore score={content.qualityScore} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-zinc-500">
                      {formatDate(content.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="mt-3 text-xs text-zinc-400">
        {rows.length} elan göstərilir
        {status ? ` — “${CONTENT_STATUSES[status].label}” statusu` : ""}
      </p>
    </div>
  );
}
