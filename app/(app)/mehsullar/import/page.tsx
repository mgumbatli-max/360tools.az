import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CsvImport } from "@/components/bulk/csv-import";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" render={<Link href="/mehsullar" />}>
          <ArrowLeft />
          Məhsullar
        </Button>
      </div>
      <PageHeader
        title="CSV idxal"
        description="Excel/CSV faylından bir neçə məhsulu eyni anda yükləyin"
        icon={<Upload className="size-5" />}
      />
      <CsvImport />
    </div>
  );
}
