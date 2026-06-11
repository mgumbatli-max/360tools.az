import { desc } from "drizzle-orm";
import { Rocket } from "lucide-react";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterPill } from "@/components/shared/filter-pills";
import { NewCampaignDialog } from "@/components/campaigns/new-campaign-dialog";
import { CampaignCard } from "@/components/campaigns/campaign-card";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { key: null, label: "Hamısı" },
  { key: "qaralama", label: "Qaralama" },
  { key: "aktiv", label: "Aktiv" },
  { key: "bitdi", label: "Bitdi" },
] as const;

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter =
    status === "qaralama" || status === "aktiv" || status === "bitdi" ? status : null;

  const allCampaigns = db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt))
    .all();

  const filtered = activeFilter
    ? allCampaigns.filter((c) => c.status === activeFilter)
    : allCampaigns;

  const countFor = (key: string | null) =>
    key === null ? allCampaigns.length : allCampaigns.filter((c) => c.status === key).length;

  return (
    <div>
      <PageHeader
        title="Kampaniyalar"
        description="Satış kampaniyalarını planla və AI ilə kontent ideyaları əldə et"
      >
        <NewCampaignDialog />
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        {STATUS_FILTERS.map((filter) => (
          <FilterPill
            key={filter.label}
            href={
              filter.key ? `/kampaniyalar?status=${filter.key}` : "/kampaniyalar"
            }
            active={activeFilter === filter.key}
            label={filter.label}
            count={countFor(filter.key)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Rocket className="size-10" />}
          title={
            activeFilter
              ? "Bu statusda kampaniya yoxdur"
              : "Hələ kampaniya yaradılmayıb"
          }
          description="Yeni kampaniya yaradın və AI ilə satış yönümlü kontent ideyaları əldə edin."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
