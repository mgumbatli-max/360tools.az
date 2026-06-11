"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Trash2,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Loader2,
  Eye,
  GraduationCap,
} from "lucide-react";
import {
  LANGUAGES,
  TONES,
  EMOJI_LEVELS,
  PLATFORM_GROUPS,
  STRUCTURE_BLOCKS,
  IMAGE_FORMATS,
  type StructureBlockKey,
} from "@/lib/constants";
import {
  savePlatform,
  deletePlatform,
  previewContent,
  type PlatformFormValues,
} from "@/lib/actions/platforms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STRUCTURE_KEYS = Object.keys(STRUCTURE_BLOCKS) as StructureBlockKey[];

function items(obj: Record<string, { label: string }>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v.label]));
}
const LANG_ITEMS = items(LANGUAGES);
const TONE_ITEMS = items(TONES);
const EMOJI_ITEMS = items(EMOJI_LEVELS);
const GROUP_ITEMS = items(PLATFORM_GROUPS);

interface PreviewState {
  title: string;
  body: string;
  hashtags: string[];
  score: number;
  issues: string[];
}

interface ProfileEditorProps {
  platformKey: string;
  isBuiltIn: boolean;
  initial: PlatformFormValues;
  hasProduct: boolean;
}

export function ProfileEditor({ platformKey, isBuiltIn, initial, hasProduct }: ProfileEditorProps) {
  const router = useRouter();
  const [v, setV] = useState<PlatformFormValues>(initial);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [saving, startSave] = useTransition();
  const [previewing, startPreview] = useTransition();

  // Struktur blokları: aktiv olanlar sıra ilə, sonra qalanları
  const [blocks, setBlocks] = useState<{ key: StructureBlockKey; active: boolean }[]>(() => {
    const active = initial.structure.filter((k): k is StructureBlockKey =>
      STRUCTURE_KEYS.includes(k as StructureBlockKey)
    );
    const rest = STRUCTURE_KEYS.filter((k) => !active.includes(k));
    return [...active.map((k) => ({ key: k, active: true })), ...rest.map((k) => ({ key: k, active: false }))];
  });

  function set<K extends keyof PlatformFormValues>(key: K, val: PlatformFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: val }));
  }

  function buildValues(): PlatformFormValues {
    return { ...v, structure: blocks.filter((b) => b.active).map((b) => b.key) };
  }

  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function toggleBlock(i: number) {
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, active: !b.active } : b)));
  }

  function onSave() {
    if (!v.label.trim()) {
      toast.error("Platforma adını yazın");
      return;
    }
    startSave(async () => {
      const result = await savePlatform(platformKey, buildValues());
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Qaydalar yadda saxlanıldı");
      router.refresh();
    });
  }

  function onPreview() {
    startPreview(async () => {
      const result = await previewContent(buildValues());
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPreview({
        title: result.content.title,
        body: result.content.body,
        hashtags: result.content.hashtags,
        score: result.score,
        issues: result.issues,
      });
    });
  }

  function onDelete() {
    if (!confirm(`"${v.label}" platformasını silmək istəyirsiniz? Yaradılmış kontentlər qalacaq.`)) return;
    startSave(async () => {
      const result = await deletePlatform(platformKey);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Sol: form */}
      <div className="space-y-6">
        {/* Əsas */}
        <Card>
          <CardHeader>
            <CardTitle>Əsas məlumat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Platforma adı</Label>
              <Input value={v.label} onChange={(e) => set("label", e.target.value)} />
            </div>
            <div className="grid grid-cols-[72px_1fr] gap-3">
              <div className="space-y-1.5">
                <Label>İkon</Label>
                <Input value={v.icon} maxLength={2} className="text-center" onChange={(e) => set("icon", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Qrup</Label>
                <Select items={GROUP_ITEMS} value={v.grp} onValueChange={(val) => set("grp", val ?? "custom")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GROUP_ITEMS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Standart dil</Label>
              <Select items={LANG_ITEMS} value={v.defaultLanguage} onValueChange={(val) => set("defaultLanguage", val ?? "az")}>
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
              <Select items={TONE_ITEMS} value={v.toneDefault} onValueChange={(val) => set("toneDefault", val ?? "standart")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TONE_ITEMS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5 sm:col-span-2">
              <span className="text-sm font-medium">Platforma aktivdir</span>
              <Switch checked={v.enabled} onCheckedChange={(c) => set("enabled", c)} />
            </label>
          </CardContent>
        </Card>

        {/* Mətn qaydaları */}
        <Card>
          <CardHeader>
            <CardTitle>Mətn qaydaları</CardTitle>
            <CardDescription>Bu limitlər həm AI generasiyasına, həm keyfiyyət yoxlamasına tətbiq olunur.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <NumField label="Başlıq (maks simvol)" value={v.titleMaxLen} onChange={(n) => set("titleMaxLen", n)} />
              <NumField label="Mətn (min simvol)" value={v.bodyMinLen} onChange={(n) => set("bodyMinLen", n)} />
              <NumField label="Mətn (maks simvol)" value={v.bodyMaxLen} onChange={(n) => set("bodyMaxLen", n)} />
              <NumField label="Hashtag (min)" value={v.hashtagMin} onChange={(n) => set("hashtagMin", n)} />
              <NumField label="Hashtag (maks)" value={v.hashtagMax} onChange={(n) => set("hashtagMax", n)} />
              <div className="space-y-1.5">
                <Label>Emoji səviyyəsi</Label>
                <Select items={EMOJI_ITEMS} value={v.emojiLevel} onValueChange={(val) => set("emojiLevel", val ?? "light")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMOJI_ITEMS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Struktur */}
        <Card>
          <CardHeader>
            <CardTitle>Kontent strukturu</CardTitle>
            <CardDescription>Blokları aktivləşdirin və sıralayın — kontent bu ardıcıllıqla qurulur.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {blocks.map((b, i) => (
              <div
                key={b.key}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2"
              >
                <Checkbox checked={b.active} onCheckedChange={() => toggleBlock(i)} />
                <span className={b.active ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                  {STRUCTURE_BLOCKS[b.key].label}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => moveBlock(i, -1)} disabled={i === 0} aria-label="Yuxarı">
                    <ChevronUp />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} aria-label="Aşağı">
                    <ChevronDown />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Söz qaydaları */}
        <Card>
          <CardHeader>
            <CardTitle>Söz və üslub qaydaları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Çağırış (CTA) mətni</Label>
              <Input value={v.ctaText} placeholder="məs. Sifariş üçün WhatsApp-a yazın!" onChange={(e) => set("ctaText", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Əlaqə formatı</Label>
              <Input value={v.contactFormat} placeholder="məs. ☎ +994 ...  |  @instagram" onChange={(e) => set("contactFormat", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Qadağan sözlər (vergüllə ayırın)</Label>
              <Input
                value={v.forbiddenWords.join(", ")}
                placeholder="məs. ucuz, bomba qiymət"
                onChange={(e) => set("forbiddenWords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              />
              <p className="text-xs text-muted-foreground">Bu sözlər kontenta düşsə keyfiyyət balı aşağı düşür.</p>
            </div>
            <ChipList
              label="Üstünlük verilən ifadələr"
              values={v.preferredPhrases}
              placeholder="məs. rəsmi zəmanət"
              onChange={(list) => set("preferredPhrases", list)}
            />
            <div className="space-y-1.5">
              <Label>Sərbəst təlimat</Label>
              <Textarea
                value={v.extraInstructions}
                rows={3}
                placeholder="Bu platforma üçün əlavə qayda — AI kontent yaradanda buna riayət edəcək. məs. 'Başlıq həmişə marka adı ilə başlasın.'"
                onChange={(e) => set("extraInstructions", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sistemi öyrət */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-4 text-brand" />
              Sistemi öyrət — nümunə postlar
            </CardTitle>
            <CardDescription>
              Bu platformada bəyəndiyiniz real postları yapışdırın. AI üslubu nümunələrdən götürəcək (məzmunu köçürməyəcək).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {v.examples.map((ex, i) => (
              <div key={i} className="relative">
                <Textarea
                  value={ex}
                  rows={3}
                  placeholder={`Nümunə post ${i + 1}`}
                  onChange={(e) =>
                    set("examples", v.examples.map((x, idx) => (idx === i ? e.target.value : x)))
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-2 top-2"
                  onClick={() => set("examples", v.examples.filter((_, idx) => idx !== i))}
                  aria-label="Sil"
                >
                  <X />
                </Button>
              </div>
            ))}
            {v.examples.length < 5 && (
              <Button variant="outline" size="sm" onClick={() => set("examples", [...v.examples, ""])}>
                <Plus />
                Nümunə əlavə et
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Şəkil formatları */}
        <Card>
          <CardHeader>
            <CardTitle>Şəkil formatları</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {Object.entries(IMAGE_FORMATS).map(([key, fmt]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3 py-2.5">
                <Checkbox
                  checked={v.imageFormats.includes(key)}
                  onCheckedChange={(c) =>
                    set("imageFormats", c === true ? [...v.imageFormats, key] : v.imageFormats.filter((k) => k !== key))
                  }
                />
                <div>
                  <div className="text-sm font-medium">{fmt.label}</div>
                  <div className="text-xs text-muted-foreground">{fmt.usage}</div>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Əməliyyatlar */}
        <div className="flex items-center gap-2">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Qaydaları yadda saxla
          </Button>
          {!isBuiltIn && (
            <Button variant="destructive" onClick={onDelete} disabled={saving}>
              <Trash2 />
              Platformanı sil
            </Button>
          )}
        </div>
      </div>

      {/* Sağ: canlı önizləmə */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-4 text-brand" />
              Canlı önizləmə
            </CardTitle>
            <CardDescription>Cari qaydalarla nümunə məhsul üzərində kontent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" size="sm" className="w-full" onClick={onPreview} disabled={previewing || !hasProduct}>
              {previewing ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {hasProduct ? "Önizləməni yenilə" : "Önizləmə üçün məhsul lazımdır"}
            </Button>

            {preview ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Keyfiyyət balı</span>
                  <Badge
                    className={
                      preview.score >= 80
                        ? "bg-emerald-50 text-emerald-700"
                        : preview.score >= 60
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }
                    variant="secondary"
                  >
                    {preview.score} / 100
                  </Badge>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="text-sm font-semibold text-foreground">{preview.title}</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{preview.body}</p>
                  {preview.hashtags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {preview.hashtags.map((h) => (
                        <span key={h} className="text-xs text-brand">#{h}</span>
                      ))}
                    </div>
                  )}
                </div>
                {preview.issues.length > 0 && (
                  <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                    {preview.issues.map((iss, i) => (
                      <li key={i}>• {iss}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Qaydaları dəyişin və önizləməni yeniləyin.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
    </div>
  );
}

function ChipList({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder?: string;
  onChange: (list: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const t = draft.trim();
    if (!t) return;
    onChange([...values, t]);
    setDraft("");
  }
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((val, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs">
              {val}
              <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))} aria-label="Sil">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
