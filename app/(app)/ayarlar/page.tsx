import { Settings2 } from "lucide-react";
import { db } from "@/lib/db";
import { brandKit } from "@/lib/db/schema";
import { BrandKitForm } from "@/components/settings/brand-kit-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const brand = db.select().from(brandKit).limit(1).get();

  if (!brand) {
    return (
      <>
        <PageHeader
          title="Ayarlar — Brand Kit"
          description="Biznesinizin brend məlumatları və standart qaydaları."
        />
        <EmptyState
          icon={<Settings2 className="size-10" />}
          title="Brand kit tapılmadı"
          description="Verilənlər bazasında brend məlumatları hələ yaradılmayıb."
        />
      </>
    );
  }

  return <BrandKitForm brand={brand} />;
}
