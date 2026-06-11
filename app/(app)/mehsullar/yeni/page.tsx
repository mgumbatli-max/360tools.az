import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/components/products/product-form";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Yeni məhsul"
        description="Məhsul məlumatlarını daxil edin — AI bu məlumatlardan kontent yaradacaq"
      />
      <ProductForm />
    </div>
  );
}
