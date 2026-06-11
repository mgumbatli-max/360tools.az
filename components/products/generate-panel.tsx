"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import {
  LANGUAGES,
  PLATFORM_GROUPS,
  TONES,
  type LanguageKey,
  type ToneKey,
} from "@/lib/constants";
import { generateContents } from "@/lib/actions/products";
import type { PlatformOption } from "@/lib/platforms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TONE_ITEMS: Record<string, string> = Object.fromEntries(
  Object.entries(TONES).map(([key, meta]) => [key, meta.label])
);

const LANGUAGE_ITEMS: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGES).map(([key, meta]) => [key, meta.label])
);

const GROUP_ORDER = ["marketplace", "social", "messaging", "web", "custom"] as const;

interface GeneratePanelProps {
  productId: number;
  aiOn: boolean;
  platforms: PlatformOption[];
}

export function GeneratePanel({ productId, aiOn, platforms }: GeneratePanelProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [language, setLanguage] = useState<LanguageKey>("az");
  const [tone, setTone] = useState<ToneKey>("standart");
  const [isPending, startTransition] = useTransition();

  const allKeys = platforms.map((p) => p.key);
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    label: PLATFORM_GROUPS[group]?.label ?? group,
    items: platforms.filter((p) => p.grp === group),
  })).filter((g) => g.items.length > 0);

  function togglePlatform(key: string, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key)
    );
  }

  function toggleAll() {
    setSelected((prev) => (prev.length === allKeys.length ? [] : [...allKeys]));
  }

  function handleGenerate() {
    if (selected.length === 0) {
      toast.error("Ən azı bir platforma seçin");
      return;
    }
    startTransition(async () => {
      const result = await generateContents({
        productId,
        platforms: selected,
        language,
        tone,
      });
      if (result.error && result.created === 0) {
        toast.error(result.error);
        return;
      }
      if (result.error) {
        toast.warning(
          `${result.created} kontent yaradıldı, lakin ${result.error.toLocaleLowerCase("az")}`
        );
      } else {
        toast.success(
          `${result.created} platforma üçün kontent yaradıldı — qaralama statusunda`
        );
      }
      setSelected([]);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-indigo-600" />
          AI Kontent Yarat
        </CardTitle>
        <CardDescription>
          Seçilmiş platformalar üçün satış kontenti avtomatik hazırlanacaq
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">
            Platformalar
          </span>
          <Button type="button" variant="ghost" size="xs" onClick={toggleAll}>
            {selected.length === allKeys.length ? "Seçimi təmizlə" : "Hamısını seç"}
          </Button>
        </div>

        <div className="space-y-3">
          {grouped.map(({ group, label, items }) => (
            <div key={group}>
              <div className="mb-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                {label}
              </div>
              <div className="space-y-1">
                {items.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <Checkbox
                      checked={selected.includes(item.key)}
                      onCheckedChange={(checked) =>
                        togglePlatform(item.key, checked === true)
                      }
                    />
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Dil</Label>
            <Select
              items={LANGUAGE_ITEMS}
              value={language}
              onValueChange={(v) => setLanguage((v as LanguageKey) ?? "az")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGE_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ton</Label>
            <Select
              items={TONE_ITEMS}
              value={tone}
              onValueChange={(v) => setTone((v as ToneKey) ?? "standart")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TONE_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={isPending || selected.length === 0}
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {isPending
            ? "Yaradılır..."
            : selected.length > 0
              ? `Yarat (${selected.length} platforma)`
              : "Yarat"}
        </Button>

        <p className="text-xs text-zinc-400">
          {aiOn
            ? "AI modeli aktivdir — kontent süni intellekt ilə yaradılacaq."
            : "AI açarı tapılmadı — daxili şablon generatoru istifadə olunacaq."}
        </p>
      </CardContent>
    </Card>
  );
}
