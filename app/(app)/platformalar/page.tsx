import { Plug, Info } from "lucide-react";
import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { getPlatforms } from "@/lib/platforms";
import {
  PLATFORM_GROUPS,
  EMOJI_LEVELS,
  type EmojiLevelKey,
  type PlatformGroupKey,
} from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AddPlatformDialog } from "@/components/platforms/add-platform-dialog";
import { PlatformCard, type PlatformCardData } from "@/components/platforms/platform-card";

export const dynamic = "force-dynamic";

const GROUP_ORDER: PlatformGroupKey[] = ["marketplace", "social", "messaging", "web", "custom"];

function ruleSummary(p: ReturnType<typeof getPlatforms>[number]): string {
  const emoji = EMOJI_LEVELS[p.emojiLevel as EmojiLevelKey]?.label ?? p.emojiLevel;
  const tags = p.hashtagMax === 0 ? "hashtagsız" : `${p.hashtagMin}–${p.hashtagMax} hashtag`;
  return `Maks ${p.titleMaxLen} simvol başlıq · ${emoji.toLowerCase()} · ${tags}`;
}

export default function PlatformsPage() {
  const platforms = getPlatforms();

  const rows = db
    .select({ platform: contents.platform, status: contents.status })
    .from(contents)
    .all();
  const stats = new Map<string, { total: number; published: number }>();
  for (const row of rows) {
    const entry = stats.get(row.platform) ?? { total: 0, published: 0 };
    entry.total += 1;
    if (row.status === "yerlesdirildi") entry.published += 1;
    stats.set(row.platform, entry);
  }

  const cards: PlatformCardData[] = platforms.map((p) => {
    const stat = stats.get(p.key) ?? { total: 0, published: 0 };
    return {
      key: p.key,
      label: p.label,
      icon: p.icon ?? "📌",
      isBuiltIn: p.isBuiltIn === 1,
      enabled: p.enabled === 1,
      ruleSummary: ruleSummary(p),
      total: stat.total,
      published: stat.published,
    };
  });

  const byGroup = GROUP_ORDER.map((g) => ({
    group: g,
    label: PLATFORM_GROUPS[g].label,
    items: cards.filter((c) => platforms.find((p) => p.key === c.key)?.grp === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        title="Platformalar"
        description="Hər platformanın öz qaydaları var — sistem kontenti bu qaydalara görə yaradır və yoxlayır"
        icon={<Plug className="size-5" />}
      >
        <AddPlatformDialog />
      </PageHeader>

      <Alert className="mb-6">
        <Info />
        <AlertTitle>Sistemi platformaya öyrədin</AlertTitle>
        <AlertDescription>
          İstənilən platformanı əlavə edin və ya mövcudun qaydalarını dəyişin: başlıq uzunluğu, emoji
          səviyyəsi, struktur, qadağan sözlər, hətta nümunə postlar. AI kontent məhz bu qaydalara uyğun
          hazırlanır. Birbaşa API bağlantıları növbəti mərhələdədir — hazırda kontent copy-paste ilə yerləşir.
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        {byGroup.map(({ group, label, items }) => (
          <section key={group}>
            <h2 className="mb-3 text-sm font-semibold text-foreground">{label}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((card) => (
                <PlatformCard key={card.key} data={card} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
