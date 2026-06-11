"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Loader2, Sparkles, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import {
  LANGUAGES,
  PLATFORM_GROUPS,
  TONES,
  formatPrice,
  type LanguageKey,
  type ToneKey,
} from "@/lib/constants";
import { bulkGenerate, type BulkGenerateDetail } from "@/lib/actions/bulk";
import type { PlatformOption } from "@/lib/platforms";
import { qualityBadgeClass } from "@/components/listings/quality-score";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformBadge } from "@/components/shared/platform-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductLite {
  id: number;
  name: string;
  category: string;
  price: number | null;
  contentCount: number;
}

const GROUP_ORDER = ["marketplace", "social", "messaging", "web", "custom"] as const;
const items = (o: Record<string, { label: string }>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.label]));
const LANG_ITEMS = items(LANGUAGES);
const TONE_ITEMS = items(TONES);

export function BulkGenerate({
  products,
  platforms,
  aiOn,
}: {
  products: ProductLite[];
  platforms: PlatformOption[];
  aiOn: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [language, setLanguage] = useState<LanguageKey>("az");
  const [tone, setTone] = useState<ToneKey>("standart");
  const [skipExisting, setSkipExisting] = useState(true);
  const [result, setResult] = useState<{ created: number; skipped: number; details: BulkGenerateDetail[] } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("az");
    return q ? products.filter((p) => p.name.toLocaleLowerCase("az").includes(q)) : products;
  }, [products, query]);

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    label: PLATFORM_GROUPS[g]?.label ?? g,
    items: platforms.filter((p) => p.grp === g),
  })).filter((g) => g.items.length > 0);

  function toggleProduct(id: number, checked: boolean) {
    setSelectedProducts((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }
  function toggleAllProducts() {
    setSelectedProducts((prev) =>
      prev.length === filtered.length ? [] : filtered.map((p) => p.id)
    );
  }
  function togglePlatform(key: string, checked: boolean) {
    setSelectedPlatforms((prev) => (checked ? [...prev, key] : prev.filter((x) => x !== key)));
  }

  const totalToCreate = selectedProducts.length * selectedPlatforms.length;

  function onGenerate() {
    if (totalToCreate === 0) {
      toast.error("Məhsul və platforma seçin");
      return;
    }
    startTransition(async () => {
      const res = await bulkGenerate({
        productIds: selectedProducts,
        platforms: selectedPlatforms,
        language,
        tone,
        skipExisting,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setResult(res);
      toast.success(`${res.created} kontent yaradıldı${res.skipped > 0 ? `, ${res.skipped} ötürüldü` : ""}`);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Məhsul seçimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Məhsullar</span>
            <Button variant="ghost" size="xs" onClick={toggleAllProducts}>
              {selectedProducts.length === filtered.length ? "Seçimi təmizlə" : "Hamısını seç"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Məhsul axtar…"
          />
          <div className="max-h-[28rem] space-y-1 overflow-y-auto scrollbar-slim pr-1">
            {filtered.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-muted/40"
              >
                <Checkbox
                  checked={selectedProducts.includes(p.id)}
                  onCheckedChange={(c) => toggleProduct(p.id, c === true)}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.category} · {formatPrice(p.price)}
                  </div>
                </div>
                {p.contentCount > 0 && (
                  <Badge variant="secondary" className="shrink-0">
                    {p.contentCount} kontent
                  </Badge>
                )}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Konfiqurasiya */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Platformalar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {grouped.map(({ group, label, items: gItems }) => (
              <div key={group}>
                <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                  {label}
                </div>
                <div className="space-y-1">
                  {gItems.map((p) => (
                    <label
                      key={p.key}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={selectedPlatforms.includes(p.key)}
                        onCheckedChange={(c) => togglePlatform(p.key, c === true)}
                      />
                      <span aria-hidden>{p.icon}</span>
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dil</Label>
                <Select items={LANG_ITEMS} value={language} onValueChange={(v) => setLanguage((v as LanguageKey) ?? "az")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANG_ITEMS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ton</Label>
                <Select items={TONE_ITEMS} value={tone} onValueChange={(v) => setTone((v as ToneKey) ?? "standart")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TONE_ITEMS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
              <span className="text-sm font-medium">Mövcud kontenti olan cütləri ötür</span>
              <Switch checked={skipExisting} onCheckedChange={setSkipExisting} />
            </label>

            <div className="rounded-xl bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
              <span className="font-semibold">{selectedProducts.length}</span> məhsul ×{" "}
              <span className="font-semibold">{selectedPlatforms.length}</span> platforma ={" "}
              <span className="font-semibold">{totalToCreate}</span> kontent
            </div>

            <Button className="w-full" onClick={onGenerate} disabled={isPending || totalToCreate === 0}>
              {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {isPending ? "Yaradılır…" : "Generasiyaya başla"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {aiOn
                ? "AI modeli aktivdir."
                : "AI açarı yoxdur — daxili şablon generatoru istifadə olunur."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Nəticə */}
      {result && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Nəticə — {result.created} kontent yaradıldı</span>
              <Button variant="outline" size="sm" render={<Link href="/elanlar" />}>
                Elanlara bax
                <ArrowUpRight />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.details.length === 0 ? (
              <p className="text-sm text-muted-foreground">Yeni kontent yaradılmadı (hamısı ötürüldü).</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {result.details.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{d.productName}</div>
                      <PlatformBadge platform={d.platform} />
                    </div>
                    <Badge variant="secondary" className={qualityBadgeClass(d.score)}>
                      {d.score}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
