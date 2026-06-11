import Link from "next/link";
import { desc, count } from "drizzle-orm";
import { Package, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { products, contents } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductRowActions } from "@/components/products/product-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    kateqoriya?: string;
    marka?: string;
    status?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const sp = await searchParams;

  const allProducts = db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt), desc(products.id))
    .all();

  const contentCounts = db
    .select({ productId: contents.productId, total: count() })
    .from(contents)
    .groupBy(contents.productId)
    .all();
  const countMap = new Map(contentCounts.map((r) => [r.productId, r.total]));

  const brands = Array.from(
    new Set(
      allProducts
        .map((p) => p.brand)
        .filter((b): b is string => Boolean(b && b.trim()))
    )
  ).sort((a, b) => a.localeCompare(b, "az"));

  const q = (sp.q ?? "").trim().toLocaleLowerCase("az");
  let rows = allProducts;
  if (q) {
    rows = rows.filter(
      (p) =>
        p.name.toLocaleLowerCase("az").includes(q) ||
        (p.brand ?? "").toLocaleLowerCase("az").includes(q)
    );
  }
  if (sp.kateqoriya) {
    rows = rows.filter((p) => p.category === sp.kateqoriya);
  }
  if (sp.marka) {
    rows = rows.filter((p) => p.brand === sp.marka);
  }
  if (sp.status) {
    rows = rows.filter((p) => p.status === sp.status);
  }

  return (
    <div>
      <PageHeader
        title="Məhsullar"
        description="Məhsul kataloqu — kontent yaratmaq üçün əsas mənbə"
      >
        <Button render={<Link href="/mehsullar/yeni" />}>
          <Plus />
          Yeni məhsul
        </Button>
      </PageHeader>

      <ProductFilters brands={brands} />

      {rows.length === 0 ? (
        <EmptyState
          icon={<Package className="size-10" />}
          title={
            allProducts.length === 0
              ? "Hələ məhsul əlavə olunmayıb"
              : "Axtarışa uyğun məhsul tapılmadı"
          }
          description={
            allProducts.length === 0
              ? "İlk məhsulunuzu əlavə edin və AI ilə kontent yaratmağa başlayın."
              : "Axtarış sözünü dəyişin və ya filtri sıfırlayın."
          }
          action={
            allProducts.length === 0 ? (
              <Button render={<Link href="/mehsullar/yeni" />}>
                <Plus />
                Yeni məhsul
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Məhsul</TableHead>
                  <TableHead>Marka / Model</TableHead>
                  <TableHead>Kateqoriya</TableHead>
                  <TableHead>Qiymət</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="text-center">Kontent</TableHead>
                  <TableHead>Yaradılıb</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const hasDiscount =
                    p.salePrice != null &&
                    p.price != null &&
                    p.salePrice < p.price;
                  const contentCount = countMap.get(p.id) ?? 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/mehsullar/${p.id}`}
                            className="font-medium text-zinc-900 hover:text-indigo-600"
                          >
                            {p.name}
                          </Link>
                          {p.status === "arxiv" && (
                            <Badge
                              variant="outline"
                              className="border-zinc-200 bg-zinc-100 text-zinc-500"
                            >
                              Arxiv
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {[p.brand, p.model].filter(Boolean).join(" / ") || "—"}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {p.category}
                      </TableCell>
                      <TableCell>
                        {hasDiscount ? (
                          <div className="flex flex-col leading-tight">
                            <span className="text-xs text-zinc-400 line-through">
                              {formatPrice(p.price)}
                            </span>
                            <span className="font-medium text-red-600">
                              {formatPrice(p.salePrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-zinc-900">
                            {formatPrice(p.salePrice ?? p.price)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.stock == null ? (
                          <span className="text-zinc-400">—</span>
                        ) : p.stock === 0 ? (
                          <Badge
                            variant="outline"
                            className="border-red-200 bg-red-50 text-red-700"
                          >
                            Bitib
                          </Badge>
                        ) : p.stock <= 5 ? (
                          <Badge
                            variant="outline"
                            className="border-red-200 bg-red-50 text-red-700"
                          >
                            {p.stock} ədəd qalıb
                          </Badge>
                        ) : (
                          <span className="text-zinc-600">{p.stock} ədəd</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{contentCount}</Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {formatDate(p.createdAt)}
                      </TableCell>
                      <TableCell>
                        <ProductRowActions
                          id={p.id}
                          name={p.name}
                          status={p.status}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="mt-3 text-xs text-zinc-400">
        {rows.length} məhsul göstərilir ({allProducts.length} ümumi)
      </p>
    </div>
  );
}
