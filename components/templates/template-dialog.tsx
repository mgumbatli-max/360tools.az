"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles } from "lucide-react";
import type { Template } from "@/lib/db/schema";
import {
  TEMPLATE_TYPES,
  PLATFORMS,
  PLATFORM_KEYS,
  type TemplateTypeKey,
} from "@/lib/constants";
import { createTemplate, updateTemplate, type TemplateInput } from "@/lib/actions/templates";
import {
  TEMPLATE_VARIABLES,
  SAMPLE_DATA,
  renderTemplate,
} from "@/components/templates/template-vars";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_KEYS = Object.keys(TEMPLATE_TYPES) as TemplateTypeKey[];
const NO_PLATFORM = "__none__";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null; // null = yeni şablon
}

export function TemplateDialog({ open, onOpenChange, template }: TemplateDialogProps) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<string>("instagram-post");
  const [platform, setPlatform] = React.useState<string>(NO_PLATFORM);
  const [content, setContent] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Dialog açılanda formu doldur / sıfırla
  React.useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setType(template?.type ?? "instagram-post");
      setPlatform(template?.platform ?? NO_PLATFORM);
      setContent(template?.content ?? "");
      setIsDefault(template ? template.isDefault === 1 : false);
    }
  }, [open, template]);

  function insertVariable(key: string) {
    setContent((prev) => {
      if (!prev) return `{${key}}`;
      const needsSpace = !prev.endsWith(" ") && !prev.endsWith("\n");
      return `${prev}${needsSpace ? " " : ""}{${key}}`;
    });
    textareaRef.current?.focus();
  }

  async function handleSave() {
    const input: TemplateInput = {
      name,
      type,
      platform: platform === NO_PLATFORM ? null : platform,
      content,
      isDefault,
    };
    setSaving(true);
    try {
      const result = template
        ? await updateTemplate(template.id, input)
        : await createTemplate(input);
      if (result.success) {
        toast.success(template ? "Şablon yeniləndi" : "Şablon yaradıldı");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Xəta baş verdi");
      }
    } catch {
      toast.error("Əməliyyat zamanı xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  const preview = renderTemplate(content, SAMPLE_DATA);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? "Şablonu redaktə et" : "Yeni şablon"}</DialogTitle>
          <DialogDescription>
            Mətndə dəyişənlərdən istifadə edin — kontent yaradılarkən real məhsul məlumatları ilə
            əvəz olunacaq.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Sol: form */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="template-name">Şablon adı</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="məs. Standart Instagram postu"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tip</Label>
                <Select
                  value={type}
                  onValueChange={(value) => setType((value as string) ?? "instagram-post")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {TEMPLATE_TYPES[type as TemplateTypeKey]?.label ?? "Tip seçin"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {TEMPLATE_TYPES[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Platforma (istəyə bağlı)</Label>
                <Select
                  value={platform}
                  onValueChange={(value) => setPlatform((value as string) ?? NO_PLATFORM)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {platform === NO_PLATFORM
                        ? "Seçilməyib"
                        : (PLATFORMS[platform as keyof typeof PLATFORMS]?.label ?? platform)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PLATFORM}>Seçilməyib</SelectItem>
                    {PLATFORM_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {PLATFORMS[key].icon} {PLATFORMS[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="template-content">Şablon mətni</Label>
              <Textarea
                id="template-content"
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={"✨ {mehsul} artıq stokda!\n💰 Qiymət: {qiymet}\n\n{hashtaglar}"}
                className="min-h-44 font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-medium text-zinc-500">
                Dəyişənlər — klikləyin, mətnə əlavə olunsun:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    title={v.label}
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[11px] text-zinc-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {`{${v.key}}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-zinc-900">Standart şablon et</div>
                <div className="text-xs text-zinc-500">
                  Bu tip üçün standart şablon kimi istifadə olunsun
                </div>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
          </div>

          {/* Sağ: canlı önizləmə */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Sparkles className="size-3.5 text-indigo-500" />
              Canlı önizləmə (nümunə məhsul ilə)
            </div>
            <div className="min-h-44 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
              {content.trim() ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-800">
                  {preview}
                </p>
              ) : (
                <p className="text-sm text-zinc-400">
                  Şablon mətnini yazdıqca nəticə burada görünəcək...
                </p>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Nümunə: Apple iPhone 16 Pro 256GB — 2 899 ₼ (endirimli 2 749 ₼), 12 ay rəsmi
              zəmanət, Bakı daxili pulsuz çatdırılma.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Ləğv et
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : !template && <Plus />}
            {template ? "Yadda saxla" : "Şablon yarat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
