import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/components/products/product-form";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const product = db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Məhsulu redaktə et"
        description={product.name}
      />
      <ProductForm product={product} />
    </div>
  );
}
