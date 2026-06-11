import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, FileText, ImageOff, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { products, contents } from "@/lib/db/schema";
import { formatDate, formatPrice, LANGUAGES, type LanguageKey } from "@/lib/constants";
import { aiAvailable } from "@/lib/ai/generate";
import { getPlatformOptions } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { qualityBadgeClass } from "@/components/listings/quality-score";
import { GeneratePanel } from "@/components/products/generate-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

interface SpecRow {
  name: string;
  value: string;
}

function parseJsonArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="shrink-0 text-sm text-zinc-500">{label}</dt>
      <dd className="text-right text-sm text-zinc-900">{children}</dd>
    </div>
  );
}

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const product = db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();
  if (!product) notFound();

  const productContents = db
    .select()
    .from(contents)
    .where(eq(contents.productId, productId))
    .orderBy(desc(contents.createdAt), desc(contents.id))
    .all();

  const specs = parseJsonArray<SpecRow>(product.specs);
  const images = parseJsonArray<string>(product.images);
  const hasDiscount =
    product.salePrice != null &&
    product.price != null &&
    product.salePrice < product.price;

  return (
    <div>
      <PageHeader
        title={product.name}
        description={[product.brand, product.model, product.category]
          .filter(Boolean)
          .join(" · ")}
      >
        <Button
          variant="outline"
          render={<Link href={`/mehsullar/${product.id}/redakte`} />}
        >
          <Pencil />
          Redaktə et
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Məhsul məlumatları</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-zinc-100">
              <InfoRow label="Status">
                <Badge
                  variant="outline"
                  className={
                    product.status === "aktiv"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-zinc-200 bg-zinc-100 text-zinc-500"
                  }
                >
                  {product.status === "aktiv" ? "Aktiv" : "Arxiv"}
                </Badge>
              </InfoRow>
              <InfoRow label="Marka">{product.brand ?? "—"}</InfoRow>
              <InfoRow label="Model">{product.model ?? "—"}</InfoRow>
              <InfoRow label="Kateqoriya">{product.category}</InfoRow>
              <InfoRow label="Qiymət">
                {hasDiscount ? (
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="font-semibold text-red-600">
                      {formatPrice(product.salePrice)}
                    </span>
                  </span>
                ) : (
                  <span className="font-semibold">
                    {formatPrice(product.salePrice ?? product.price)}
                  </span>
                )}
              </InfoRow>
              <InfoRow label="Stok">
                {product.stock == null ? (
                  "—"
                ) : product.stock <= 5 ? (
                  <Badge
                    variant="outline"
                    className="border-red-200 bg-red-50 text-red-700"
                  >
                    {product.stock === 0
                      ? "Bitib"
                      : `${product.stock} ədəd qalıb`}
                  </Badge>
                ) : (
                  `${product.stock} ədəd`
                )}
              </InfoRow>
              <InfoRow label="Zəmanət">{product.warranty ?? "—"}</InfoRow>
              <InfoRow label="Rəng">{product.color ?? "—"}</InfoRow>
              <InfoRow label="Ölçü">{product.size ?? "—"}</InfoRow>
              <InfoRow label="Çatdırılma">{product.delivery ?? "—"}</InfoRow>
              {product.note && <InfoRow label="Qeyd">{product.note}</InfoRow>}
              <InfoRow label="Yaradılıb">
                {formatDate(product.createdAt)}
              </InfoRow>
              <InfoRow label="Yenilənib">
                {formatDate(product.updatedAt)}
              </InfoRow>
            </dl>

            <Separator className="my-4" />

            <h3 className="mb-2 text-sm font-medium text-zinc-900">
              Texniki göstəricilər
            </h3>
            {specs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Göstərici</TableHead>
                    <TableHead>Dəyər</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specs.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-zinc-500">{s.name}</TableCell>
                      <TableCell className="font-medium text-zinc-900">
                        {s.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-zinc-400">
                Texniki göstərici əlavə olunmayıb.
              </p>
            )}

            <Separator className="my-4" />

            <h3 className="mb-2 text-sm font-medium text-zinc-900">Şəkillər</h3>
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`${product.name} — şəkil ${i + 1}`}
                    className="aspect-square w-full rounded-lg border border-zinc-200 bg-zinc-50 object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                <ImageOff className="size-4" />
                Şəkil yüklənməyib
              </p>
            )}
          </CardContent>
        </Card>

        <div>
          <GeneratePanel
            productId={product.id}
            aiOn={aiAvailable()}
            platforms={getPlatformOptions()}
          />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-zinc-900">
          Bu məhsulun kontentləri{" "}
          <span className="text-sm font-normal text-zinc-400">
            ({productContents.length})
          </span>
        </h2>

        {productContents.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-10" />}
            title="Hələ kontent yaradılmayıb"
            description="Sağdakı paneldən platforma seçib AI ilə ilk kontenti yaradın."
          />
        ) : (
          <Card className="py-0">
            <CardContent className="divide-y divide-zinc-100 p-0">
              {productContents.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-900">
                      {c.title}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <PlatformBadge platform={c.platform} />
                      <StatusBadge status={c.status} />
                      {c.qualityScore != null && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            qualityBadgeClass(c.qualityScore)
                          )}
                        >
                          Keyfiyyət: {c.qualityScore}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-zinc-500">
                        {LANGUAGES[c.language as LanguageKey]?.label ??
                          c.language.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-zinc-400">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/elanlar/${c.id}`} />}
                  >
                    Elanlara bax
                    <ArrowUpRight />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
