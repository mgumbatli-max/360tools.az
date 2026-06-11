"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, Loader2, Save, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformBadge } from "@/components/shared/platform-badge";
import {
  qualityBarColor,
  qualityColor,
} from "@/components/listings/quality-score";
import { PLATFORMS, PLATFORM_KEYS, LANGUAGES, TONES, TONE_KEYS, type PlatformKey, type LanguageKey, type ToneKey } from "@/lib/constants";
import { quickGenerate, saveAsContent } from "@/lib/actions/ai-studio";
import { cn } from "@/lib/utils";

export interface ProductOption {
  id: number;
  name: string;
  category: string;
}

interface GenerateResult {
  title: string;
  body: string;
  hashtags: string[];
  seoKeywords: string[];
  score: number;
  issues: string[];
}

export function QuickGenerate({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [productId, setProductId] = React.useState<string>(products[0] ? String(products[0].id) : "");
  const [platform, setPlatform] = React.useState<PlatformKey>("instagram-post");
  const [language, setLanguage] = React.useState<LanguageKey>("az");
  const [tone, setTone] = React.useState<ToneKey>("standart");
  const [extra, setExtra] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [savedId, setSavedId] = React.useState<number | null>(null);
  const [result, setResult] = React.useState<GenerateResult | null>(null);

  const productItems = products.map((p) => ({ value: String(p.id), label: p.name }));
  const platformItems = PLATFORM_KEYS.map((key) => ({
    value: key,
    label: `${PLATFORMS[key].icon} ${PLATFORMS[key].label}`,
  }));
  const languageItems = (Object.keys(LANGUAGES) as LanguageKey[]).map((key) => ({
    value: key,
    label: LANGUAGES[key].label,
  }));
  const toneItems = TONE_KEYS.map((key) => ({
    value: key,
    label: TONES[key].label,
  }));

  async function handleGenerate() {
    if (!productId) {
      toast.error("Zəhmət olmasa məhsul seçin");
      return;
    }
    setGenerating(true);
    setSavedId(null);
    try {
      const res = await quickGenerate({
        productId: Number(productId),
        platform,
        language,
        tone,
        extraInstructions: extra.trim() || undefined,
      });
      if (!res.ok || res.title == null || res.body == null) {
        toast.error(res.error ?? "Generasiya alınmadı");
        return;
      }
      setResult({
        title: res.title,
        body: res.body,
        hashtags: res.hashtags ?? [],
        seoKeywords: res.seoKeywords ?? [],
        score: res.score ?? 0,
        issues: res.issues ?? [],
      });
      toast.success("Kontent hazırdır");
    } catch (err) {
      console.error(err);
      toast.error("Generasiya zamanı xəta baş verdi");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    const text = [
      result.title,
      "",
      result.body,
      result.hashtags.length ? "\n" + result.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ") : "",
    ]
      .join("\n")
      .trim();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Kontent buferə kopyalandı");
    } catch {
      toast.error("Kopyalama alınmadı");
    }
  }

  async function handleSave() {
    if (!result || !productId) return;
    setSaving(true);
    try {
      const res = await saveAsContent({
        productId: Number(productId),
        platform,
        language,
        title: result.title,
        body: result.body,
        hashtags: result.hashtags,
        seoKeywords: result.seoKeywords,
        score: result.score,
        issues: result.issues,
      });
      if (!res.ok || res.id == null) {
        toast.error(res.error ?? "Yadda saxlama alınmadı");
        return;
      }
      setSavedId(res.id);
      toast.success("Elan qaralama statusu ilə yadda saxlanıldı", {
        action: {
          label: "Elanlara keç",
          onClick: () => router.push("/elanlar"),
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Yadda saxlama zamanı xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="size-10" />}
        title="Hələ məhsul yoxdur"
        description="Kontent yaratmaq üçün əvvəlcə məhsul əlavə edin — generasiya seçilmiş məhsulun məlumatları əsasında işləyir."
        action={
          <Button render={<Link href="/mehsullar/yeni" />}>
            Məhsul yarat
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="size-4 text-indigo-600" />
            Sürətli generasiya
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qg-product">Məhsul</Label>
            <Select
              items={productItems}
              value={productId || null}
              onValueChange={(value) => {
                if (typeof value === "string") setProductId(value);
              }}
            >
              <SelectTrigger id="qg-product" className="w-full">
                <SelectValue placeholder="Məhsul seçin" />
              </SelectTrigger>
              <SelectContent>
                {productItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qg-platform">Platforma</Label>
              <Select
                items={platformItems}
                value={platform}
                onValueChange={(value) => {
                  if (typeof value === "string") setPlatform(value as PlatformKey);
                }}
              >
                <SelectTrigger id="qg-platform" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qg-language">Dil</Label>
              <Select
                items={languageItems}
                value={language}
                onValueChange={(value) => {
                  if (typeof value === "string") setLanguage(value as LanguageKey);
                }}
              >
                <SelectTrigger id="qg-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qg-tone">Ton</Label>
            <Select
              items={toneItems}
              value={tone}
              onValueChange={(value) => {
                if (typeof value === "string") setTone(value as ToneKey);
              }}
            >
              <SelectTrigger id="qg-tone" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {toneItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qg-extra">Əlavə təlimat (istəyə bağlı)</Label>
            <Textarea
              id="qg-extra"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Məsələn: endirimi vurğula, çatdırılmanın pulsuz olduğunu qeyd et..."
              rows={3}
            />
          </div>

          <Button onClick={handleGenerate} disabled={generating || !productId} className="w-full">
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Hazırlanır...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Yarat
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
              <span>Nəticə</span>
              <PlatformBadge platform={platform} />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-medium tracking-wide text-zinc-400 uppercase">Başlıq</div>
              <div className="mt-1 text-sm font-semibold text-zinc-900">{result.title}</div>
            </div>

            <div>
              <div className="text-xs font-medium tracking-wide text-zinc-400 uppercase">Mətn</div>
              <div className="mt-1 max-h-64 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm whitespace-pre-wrap text-zinc-800">
                {result.body}
              </div>
            </div>

            {result.hashtags.length > 0 && (
              <div>
                <div className="text-xs font-medium tracking-wide text-zinc-400 uppercase">Hashtaglar</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {result.hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-normal">
                      #{tag.replace(/^#/, "")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium tracking-wide text-zinc-400 uppercase">Keyfiyyət balı</div>
                <div className={cn("text-sm font-semibold", qualityColor(result.score))}>{result.score}/100</div>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={cn("h-full rounded-full transition-all", qualityBarColor(result.score))}
                  style={{ width: `${result.score}%` }}
                />
              </div>
              {result.issues.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {result.issues.map((issue) => (
                    <li key={issue} className="flex items-start gap-1.5 text-xs text-amber-700">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="size-4" />
                Kopyala
              </Button>
              {savedId == null ? (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Elan kimi yadda saxla
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                    <Check className="size-3" />
                    Yadda saxlanıldı
                  </Badge>
                  <Link href="/elanlar" className="text-sm font-medium text-indigo-600 hover:underline">
                    Elanlara keç
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Sparkles className="size-8" />}
          title="Nəticə burada görünəcək"
          description="Sol tərəfdə məhsul və platforma seçib «Yarat» düyməsinə klikləyin — hazır kontent, hashtaglar və keyfiyyət balı burada göstəriləcək."
        />
      )}
    </div>
  );
}
