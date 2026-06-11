import Link from "next/link";
import { desc, count, eq } from "drizzle-orm";
import { ArrowLeft, Layers } from "lucide-react";
import { db } from "@/lib/db";
import { products, contents } from "@/lib/db/schema";
import { getPlatformOptions } from "@/lib/platforms";
import { aiAvailable } from "@/lib/ai/generate";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { BulkGenerate } from "@/components/bulk/bulk-generate";

export const dynamic = "force-dynamic";

export default function BulkGeneratePage() {
  const rows = db
    .select()
    .from(products)
    .where(eq(products.status, "aktiv"))
    .orderBy(desc(products.createdAt), desc(products.id))
    .all();

  const contentCounts = db
    .select({ productId: contents.productId, total: count() })
    .from(contents)
    .groupBy(contents.productId)
    .all();
  const countMap = new Map(contentCounts.map((r) => [r.productId, r.total]));

  const productList = rows.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.salePrice ?? p.price,
    contentCount: countMap.get(p.id) ?? 0,
  }));

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" render={<Link href="/mehsullar" />}>
          <ArrowLeft />
          Məhsullar
        </Button>
      </div>
      <PageHeader
        title="Toplu generasiya"
        description="Bir neçə məhsul üçün eyni anda çoxlu platformaya kontent yaradın"
        icon={<Layers className="size-5" />}
      />

      {productList.length === 0 ? (
        <EmptyState
          icon={<Layers className="size-7" />}
          title="Aktiv məhsul yoxdur"
          description="Toplu generasiya üçün əvvəlcə məhsul əlavə edin."
          action={
            <Button render={<Link href="/mehsullar/yeni" />}>Məhsul yarat</Button>
          }
        />
      ) : (
        <BulkGenerate
          products={productList}
          platforms={getPlatformOptions()}
          aiOn={aiAvailable()}
        />
      )}
    </div>
  );
}
