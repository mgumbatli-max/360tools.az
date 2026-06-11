import { Image as ImageIcon, Images, Package } from "lucide-react";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { AddImagePanel } from "@/components/images/add-image-panel";
import { AiToolsCard } from "@/components/images/ai-tools-card";
import {
  ImageGallery,
  type GalleryItem,
} from "@/components/images/image-gallery";

export const dynamic = "force-dynamic";

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

export default function ImagesPage() {
  const rows = db
    .select({ id: products.id, name: products.name, images: products.images })
    .from(products)
    .orderBy(products.name)
    .all();

  const items: GalleryItem[] = [];
  for (const row of rows) {
    for (const url of parseImages(row.images)) {
      items.push({ productId: row.id, productName: row.name, url });
    }
  }

  const productsWithImages = new Set(items.map((item) => item.productId)).size;
  const productOptions = rows.map((row) => ({ id: row.id, name: row.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Şəkillər"
        description="Məhsul şəkilləri, format presetləri və AI düzəliş alətləri"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Cəmi şəkil"
          value={items.length}
          icon={<Images className="size-5" />}
          accent="indigo"
        />
        <StatCard
          label="Şəkilli məhsul"
          value={productsWithImages}
          hint={`${rows.length} məhsuldan`}
          icon={<Package className="size-5" />}
          accent="emerald"
        />
        <StatCard
          label="Format presetləri"
          value={4}
          hint="1:1, 4:5, 9:16, 16:9"
          icon={<ImageIcon className="size-5" />}
          accent="amber"
        />
      </div>

      <AddImagePanel products={productOptions} />

      {items.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="size-8" />}
          title="Hələ şəkil yoxdur"
          description="Məhsullara şəkil əlavə etmək üçün yuxarıdakı paneldən URL daxil edin və ya fayl yükləyin. Şəkillər avtomatik olaraq bütün platforma formatlarına uyğunlaşdırılır."
        />
      ) : (
        <ImageGallery items={items} />
      )}

      <AiToolsCard />
    </div>
  );
}
