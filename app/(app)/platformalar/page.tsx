import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { PLATFORMS, PLATFORM_KEYS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const GROUP_LABELS: Record<string, string> = {
  marketplace: "Marketplace",
  social: "Sosial media",
  web: "Veb",
  messaging: "Mesajlaşma",
};

export default function PlatformsPage() {
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

  return (
    <div>
      <PageHeader
        title="Platformalar"
        description="Bağlı platformalar və kontent paylaşım vəziyyəti"
      />

      <Alert className="mb-6">
        <Info />
        <AlertTitle>Copy-paste rejimi</AlertTitle>
        <AlertDescription>
          MVP mərhələsində kontentlər hazır formatda kopyalanıb platformalara
          yerləşdirilir. Birbaşa API bağlantıları növbəti mərhələdədir.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PLATFORM_KEYS.map((key) => {
          const meta = PLATFORMS[key];
          const stat = stats.get(key) ?? { total: 0, published: 0 };
          return (
            <Card key={key} className="py-0">
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-xl"
                      aria-hidden
                    >
                      {meta.icon}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {meta.label}
                      </div>
                      <Badge variant="secondary" className="mt-0.5">
                        {GROUP_LABELS[meta.group] ?? meta.group}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-zinc-50 px-3 py-2">
                    <div className="text-lg font-semibold text-zinc-900">
                      {stat.total}
                    </div>
                    <div className="text-xs text-zinc-500">kontent (cəmi)</div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-3 py-2">
                    <div className="text-lg font-semibold text-emerald-700">
                      {stat.published}
                    </div>
                    <div className="text-xs text-emerald-600">
                      yerləşdirilmiş
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Copy-paste rejimi aktiv
                  </div>
                  <div className="pl-4 text-xs text-zinc-400">
                    API inteqrasiyası tezliklə
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    render={<Link href={`/elanlar?platform=${key}`} />}
                  >
                    Elanlara bax
                    <ArrowRight />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
