import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Kontent əməliyyatlarının ümumi görünüşü"
      />
      <p className="text-sm text-zinc-500">Dashboard hazırlanır…</p>
    </div>
  );
}
