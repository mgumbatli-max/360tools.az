"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Send,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateContentStatus } from "@/lib/actions/contents";
import { CONTENT_STATUSES, type ContentStatusKey } from "@/lib/constants";

interface ActionDef {
  to: ContentStatusKey;
  label: string;
  icon: React.ReactNode;
  variant: "default" | "outline";
}

const ACTIONS: Partial<Record<ContentStatusKey, ActionDef[]>> = {
  qaralama: [
    {
      to: "hazirdir",
      label: "Hazırdır işarələ",
      icon: <CheckCircle2 />,
      variant: "default",
    },
  ],
  hazirdir: [
    {
      to: "tesdiq-gozleyir",
      label: "Təsdiqə göndər",
      icon: <Send />,
      variant: "default",
    },
  ],
  "tesdiq-gozleyir": [
    {
      to: "yerlesdirildi",
      label: "Təsdiqlə və yerləşdirildi işarələ",
      icon: <BadgeCheck />,
      variant: "default",
    },
    {
      to: "qaralama",
      label: "Geri qaytar (qaralama)",
      icon: <Undo2 />,
      variant: "outline",
    },
  ],
  xeta: [
    {
      to: "hazirdir",
      label: "Yenidən cəhd (hazırdır)",
      icon: <RotateCcw />,
      variant: "default",
    },
  ],
};

export function StatusActions({
  contentId,
  status,
}: {
  contentId: number;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  const actions = ACTIONS[status as ContentStatusKey] ?? [];

  function run(action: ActionDef) {
    startTransition(async () => {
      const result = await updateContentStatus(contentId, action.to);
      if (result.ok) {
        toast.success(
          `Status "${CONTENT_STATUSES[action.to].label}" olaraq yeniləndi`
        );
      } else {
        toast.error(result.error ?? "Xəta baş verdi");
      }
    });
  }

  if (actions.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Bu elan yerləşdirilib — əlavə status əməliyyatı tələb olunmur.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {actions.map((action) => (
        <Button
          key={action.to}
          variant={action.variant}
          disabled={isPending}
          onClick={() => run(action)}
          className="w-full justify-start"
        >
          {isPending ? <Loader2 className="animate-spin" /> : action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
