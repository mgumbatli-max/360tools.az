"use client";

import {
  Eraser,
  Focus,
  PaintBucket,
  ShieldCheck,
  Sparkles,
  Stamp,
  SunMedium,
  Wand2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FEATURES: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { label: "Fon silmə", icon: Eraser },
  { label: "Ağ fon", icon: PaintBucket },
  { label: "Premium fon", icon: Sparkles },
  { label: "İşıq korreksiyası", icon: SunMedium },
  { label: "Kəskinləşdirmə", icon: Focus },
  { label: "Su nişanı / logo", icon: Stamp },
];

export function AiToolsCard() {
  return (
    <Card className="py-0">
      <CardHeader className="px-5 pt-5 pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="size-4 text-indigo-600" />
          AI Şəkil Düzəlişi
        </CardTitle>
        <p className="text-sm text-zinc-500">
          Məhsul şəkillərini avtomatik təkmilləşdirmə alətləri
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((feature) => (
              <Tooltip key={feature.label}>
                <TooltipTrigger render={<span className="inline-flex" />}>
                  <Button variant="outline" size="sm" disabled>
                    <feature.icon />
                    {feature.label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Xarici şəkil emalı API açarı qoşulduqda aktiv olacaq
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        <Alert>
          <ShieldCheck />
          <AlertTitle>Dürüstlük prinsipi</AlertTitle>
          <AlertDescription>
            Şəkil düzəlişləri real məhsulun görünüşünü dəyişməməlidir — yalnız
            fon, işıq və təqdimat keyfiyyəti yaxşılaşdırılır. Müştəri gördüyü
            məhsulu almalıdır.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
