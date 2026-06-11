"use client";

import { useState, useTransition } from "react";
import { CalendarRange, CheckCircle2, Lightbulb, Play, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CAMPAIGN_TYPES, formatDate, type CampaignTypeKey } from "@/lib/constants";
import type { Campaign } from "@/lib/db/schema";
import { deleteCampaign, generateIdeas, updateCampaignStatus } from "@/lib/actions/campaigns";

export const CAMPAIGN_STATUSES = {
  qaralama: { label: "Qaralama", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  aktiv: { label: "Aktiv", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  bitdi: { label: "Bitdi", color: "bg-zinc-200 text-zinc-600 border-zinc-300" },
} as const;

type PendingAction = "ideas" | "status" | "delete" | null;

function parseIdeas(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((i): i is string => typeof i === "string") : [];
  } catch {
    return [];
  }
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const typeMeta = CAMPAIGN_TYPES[campaign.type as CampaignTypeKey];
  const statusMeta =
    CAMPAIGN_STATUSES[campaign.status as keyof typeof CAMPAIGN_STATUSES] ??
    CAMPAIGN_STATUSES.qaralama;
  const ideas = parseIdeas(campaign.ideas);
  const hasDates = Boolean(campaign.startDate || campaign.endDate);

  function run(action: PendingAction, fn: () => Promise<{ ok: boolean; error?: string }>, successMessage: string) {
    setPendingAction(action);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(successMessage);
      } else {
        toast.error(res.error ?? "Xəta baş verdi");
      }
      setPendingAction(null);
    });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{campaign.name}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            {typeMeta?.label ?? campaign.type}
          </Badge>
          {hasDates && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <CalendarRange className="size-3.5" />
              {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
            </span>
          )}
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className={cn("border font-medium", statusMeta.color)}>
            {statusMeta.label}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {campaign.description && (
          <p className="text-sm text-zinc-600">{campaign.description}</p>
        )}
        {ideas.length > 0 ? (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Lightbulb className="size-3.5 text-amber-500" />
              İdeyalar
            </div>
            <ul className="space-y-1.5">
              {ideas.map((idea, index) => (
                <li key={index} className="flex gap-2 text-sm text-zinc-700">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-400" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            Hələ ideya yoxdur — &quot;AI ideya yarat&quot; düyməsi ilə kontent ideyaları əldə edin.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            run("ideas", () => generateIdeas(campaign.id), "Kampaniya ideyaları yaradıldı")
          }
        >
          <Sparkles data-icon="inline-start" className="text-indigo-600" />
          {isPending && pendingAction === "ideas" ? "Yaradılır…" : "AI ideya yarat"}
        </Button>
        {campaign.status === "qaralama" && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              run("status", () => updateCampaignStatus(campaign.id, "aktiv"), "Kampaniya aktivləşdirildi")
            }
          >
            <Play data-icon="inline-start" />
            Aktivləşdir
          </Button>
        )}
        {campaign.status === "aktiv" && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              run("status", () => updateCampaignStatus(campaign.id, "bitdi"), "Kampaniya bitdi kimi işarələndi")
            }
          >
            <CheckCircle2 data-icon="inline-start" />
            Bitir
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="ml-auto"
          disabled={isPending}
          onClick={() => run("delete", () => deleteCampaign(campaign.id), "Kampaniya silindi")}
        >
          <Trash2 data-icon="inline-start" />
          Sil
        </Button>
      </CardFooter>
    </Card>
  );
}
