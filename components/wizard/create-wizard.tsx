"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Plus,
  X,
  Copy,
  Check,
  Package,
  ImagePlus,
  Megaphone,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { LANGUAGES, type LanguageKey } from "@/lib/constants";
import { createAndGenerate, type WizardResult } from "@/lib/actions/wizard";
import { uploadStandaloneImage } from "@/lib/actions/images";
import type { PlatformOption } from "@/lib/platforms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Package, label: "Məhsul" },
  { icon: ImagePlus, label: "Şəkil" },
  { icon: Megaphone, label: "Platformalar" },
];

const POPULAR = ["instagram-post", "tap-az"];

export function CreateWizard({ platforms }: { platforms: PlatformOption[] }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [note, setNote] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageDraft, setImageDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    platforms.filter((p) => POPULAR.includes(p.key)).map((p) => p.key)
  );
  const [language, setLanguage] = useState<LanguageKey>("az");
  const [results, setResults] = useState<WizardResult[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function addImage() {
    const t = imageDraft.trim();
    if (!t) return;
    setImages((prev) => [...prev, t]);
    setImageDraft("");
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadStandaloneImage(fd);
        if (res.ok && res.url) {
          setImages((prev) => [...prev, res.url!]);
        } else {
          toast.error(res.error ?? "Şəkil yüklənmədi");
        }
      }
    } catch {
      toast.error("Şəkil yükləmə zamanı xəta baş verdi");
    } finally {
      setUploading(false);
    }
  }

  function toggle(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function onGenerate() {
    if (!name.trim()) {
      toast.error("Məhsulun adını yazın");
      setStep(0);
      return;
    }
    if (selected.length === 0) {
      toast.error("Ən azı bir platforma seçin");
      return;
    }
    startTransition(async () => {
      const res = await createAndGenerate({
        name,
        price: price ? Number(price) : null,
        salePrice: salePrice ? Number(salePrice) : null,
        note,
        images,
        platforms: selected,
        language,
        tone: "standart",
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setResults(res.results);
      toast.success(`${res.results.length} platforma üçün kontent hazırdır! 🎉`);
    });
  }

  // ---------- Nəticə ekranı ----------
  if (results) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <PartyPopper className="size-7" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Kontent hazırdır!</h2>
          <p className="mt-1 text-muted-foreground">
            {results.length} platforma üçün mətn yaradıldı. Kopyala və paylaş.
          </p>
        </div>

        <div className="space-y-4">
          {results.map((r) => (
            <ResultCard key={r.platform} result={r} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button render={<Link href="/elanlar" />}>
            <Megaphone />
            Bütün kontentlərə bax
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setResults(null);
              setStep(0);
              setName("");
              setPrice("");
              setSalePrice("");
              setNote("");
              setImages([]);
              setSelected(platforms.filter((p) => POPULAR.includes(p.key)).map((p) => p.key));
            }}
          >
            <Sparkles />
            Yenisini yarat
          </Button>
        </div>
      </div>
    );
  }

  // ---------- Sehrbaz addımları ----------
  return (
    <div className="mx-auto max-w-2xl">
      {/* Addım göstəricisi */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="size-4" /> : <s.icon className="size-4" />}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 w-8 rounded-full", i < step ? "bg-emerald-200" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Məhsulun nədir?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Az məlumat kifayətdir — AI qalanını peşəkar şəkildə tamamlayır.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Məhsulun adı</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="məs. Apple iPhone 16 Pro 256GB"
                className="h-11 text-base"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Qiymət (₼)</Label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="2899" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Endirimli qiymət (₼)</Label>
                <Input value={salePrice} onChange={(e) => setSalePrice(e.target.value)} type="number" placeholder="2749" className="h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Qısa qeyd (istəyə bağlı)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="məs. Titan qara, 12 ay zəmanət, Bakı daxili pulsuz çatdırılma"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Şəkil əlavə et</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                İstəyə bağlıdır — şəkil linkini yapışdır. Sonra da əlavə edə bilərsən.
              </p>
            </div>
            {/* Kompüterdən yüklə */}
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center transition hover:border-primary/40 hover:bg-muted/50",
                uploading && "pointer-events-none opacity-60"
              )}
            >
              {uploading ? (
                <Loader2 className="size-7 animate-spin text-primary" />
              ) : (
                <ImagePlus className="size-7 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {uploading ? "Yüklənir…" : "Kompüterdən şəkil seç"}
              </span>
              <span className="text-xs text-muted-foreground">JPG, PNG, WEBP — maks 8 MB</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={onUpload} disabled={uploading} />
            </label>

            {/* və ya link */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">və ya link yapışdır</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex gap-2">
              <Input
                value={imageDraft}
                onChange={(e) => setImageDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage();
                  }
                }}
                placeholder="https://… şəkil linki"
                className="h-11"
              />
              <Button type="button" variant="outline" className="h-11" onClick={addImage}>
                <Plus />
                Əlavə et
              </Button>
            </div>
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="size-full object-cover" />
                    <button
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Sil"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-10 text-center">
                <ImagePlus className="size-7 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Hələ şəkil yoxdur — bu addımı ötürə bilərsən</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Harada paylaşacaqsan?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Seçdiyin hər platforma üçün ayrıca uyğun mətn hazırlanacaq.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {platforms.map((p) => {
                const on = selected.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => toggle(p.key)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-left text-sm font-medium transition-all",
                      on
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border bg-card text-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    <span className="text-lg" aria-hidden>{p.icon}</span>
                    <span className="truncate">{p.label}</span>
                    {on && <Check className="ml-auto size-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <Label className="shrink-0">Dil:</Label>
              <div className="flex gap-1.5">
                {(Object.keys(LANGUAGES) as LanguageKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setLanguage(k)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      language === k ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {k.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Naviqasiya düymələri */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || isPending}>
          <ArrowLeft />
          Geri
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => {
              if (step === 0 && !name.trim()) {
                toast.error("Məhsulun adını yazın");
                return;
              }
              setStep((s) => s + 1);
            }}
          >
            Növbəti
            <ArrowRight />
          </Button>
        ) : (
          <Button onClick={onGenerate} disabled={isPending || selected.length === 0} className="min-w-44">
            {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {isPending ? "AI işləyir…" : "Kontent yarat"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: WizardResult }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const text = [result.title, "", result.body, result.hashtags.length ? "\n" + result.hashtags.map((h) => `#${h}`).join(" ") : ""]
      .join("\n")
      .trim();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Kopyalandı");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-lg" aria-hidden>{result.platformIcon}</span>
          {result.platformLabel}
        </div>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="text-emerald-600" /> : <Copy />}
          {copied ? "Kopyalandı" : "Kopyala"}
        </Button>
      </div>
      <div className="text-sm font-semibold text-foreground">{result.title}</div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{result.body}</p>
      {result.hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {result.hashtags.map((h) => (
            <span key={h} className="text-xs text-brand">#{h}</span>
          ))}
        </div>
      )}
    </div>
  );
}
