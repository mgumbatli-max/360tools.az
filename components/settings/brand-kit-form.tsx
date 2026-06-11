"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AtSign,
  Building2,
  Loader2,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";
import type { BrandKit } from "@/lib/db/schema";
import { formatDate } from "@/lib/constants";
import { saveBrandKit, type BrandKitInput } from "@/lib/actions/brand";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const FONT_STYLES = [
  "Müasir sans-serif",
  "Klassik serif",
  "Yumru və dostcanlı",
  "Texniki monospace",
  "Elegant və incə",
];

function parseMessages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function BrandKitForm({ brand }: { brand: BrandKit }) {
  const [businessName, setBusinessName] = React.useState(brand.businessName);
  const [slogan, setSlogan] = React.useState(brand.slogan ?? "");
  const [logoUrl, setLogoUrl] = React.useState(brand.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = React.useState(brand.primaryColor ?? "#4f46e5");
  const [secondaryColor, setSecondaryColor] = React.useState(
    brand.secondaryColor ?? "#f59e0b"
  );
  const [fontStyle, setFontStyle] = React.useState(brand.fontStyle ?? "Müasir sans-serif");
  const [phone, setPhone] = React.useState(brand.phone ?? "");
  const [whatsapp, setWhatsapp] = React.useState(brand.whatsapp ?? "");
  const [instagram, setInstagram] = React.useState(brand.instagram ?? "");
  const [address, setAddress] = React.useState(brand.address ?? "");
  const [deliveryPolicy, setDeliveryPolicy] = React.useState(brand.deliveryPolicy ?? "");
  const [warrantyPolicy, setWarrantyPolicy] = React.useState(brand.warrantyPolicy ?? "");
  const [salesMessages, setSalesMessages] = React.useState<string[]>(
    parseMessages(brand.salesMessages)
  );
  const [logoError, setLogoError] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const safePrimary = HEX_RE.test(primaryColor) ? primaryColor : "#4f46e5";
  const safeSecondary = HEX_RE.test(secondaryColor) ? secondaryColor : "#f59e0b";

  const fontItems = FONT_STYLES.includes(fontStyle)
    ? FONT_STYLES
    : [fontStyle, ...FONT_STYLES];

  async function handleSave() {
    const input: BrandKitInput = {
      businessName,
      logoUrl,
      primaryColor,
      secondaryColor,
      fontStyle,
      phone,
      whatsapp,
      instagram,
      address,
      deliveryPolicy,
      warrantyPolicy,
      slogan,
      salesMessages,
    };
    setSaving(true);
    try {
      const result = await saveBrandKit(brand.id, input);
      if (result.success) {
        toast.success("Yadda saxlanıldı");
      } else {
        toast.error(result.error ?? "Xəta baş verdi");
      }
    } catch {
      toast.error("Əməliyyat zamanı xəta baş verdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ayarlar — Brand Kit"
        description="Biznesinizin brend məlumatları və standart qaydaları."
      >
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          Yadda saxla
        </Button>
      </PageHeader>

      <Alert>
        <Sparkles className="size-4" />
        <AlertTitle>AI ilə inteqrasiya</AlertTitle>
        <AlertDescription>
          Bu məlumatlar AI kontent yaradılarkən avtomatik istifadə olunur — əlaqə məlumatları,
          çatdırılma və zəmanət qaydaları mətnlərə avtomatik daxil edilir.
        </AlertDescription>
      </Alert>

      {/* Canlı brend önizləməsi */}
      <Card className="overflow-hidden py-0">
        <div className="h-1.5" style={{ backgroundColor: safePrimary }} />
        <CardContent className="flex flex-wrap items-center gap-5 p-5">
          {logoUrl.trim() && !logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${businessName || "Biznes"} loqosu`}
              className="size-16 shrink-0 rounded-xl border border-zinc-100 bg-white object-contain p-1"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div
              className="flex size-16 shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white"
              style={{ backgroundColor: safePrimary }}
            >
              {(businessName.trim() || "B").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-xl font-semibold tracking-tight"
              style={{ color: safePrimary }}
            >
              {businessName.trim() || "Biznes adı"}
            </h2>
            {slogan.trim() && <p className="mt-0.5 text-sm text-zinc-500">{slogan}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              {phone.trim() && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3" style={{ color: safeSecondary }} />
                  {phone}
                </span>
              )}
              {instagram.trim() && (
                <span className="inline-flex items-center gap-1">
                  <AtSign className="size-3" style={{ color: safeSecondary }} />
                  {instagram}
                </span>
              )}
              {address.trim() && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" style={{ color: safeSecondary }} />
                  {address}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-[11px] text-zinc-400">
            Son yenilənmə
            <br />
            {formatDate(brand.updatedAt)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Biznes məlumatları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-indigo-500" />
              Biznes məlumatları
            </CardTitle>
            <CardDescription>Brendinizin əsas təqdimat məlumatları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bk-name">Biznes adı</Label>
              <Input
                id="bk-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="məs. TechStore Baku"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-slogan">Slogan</Label>
              <Input
                id="bk-slogan"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="məs. Texnologiya bir addım yaxında"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-logo">Logo URL</Label>
              <Input
                id="bk-logo"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setLogoError(false);
                }}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Font stili</Label>
              <Select
                value={fontStyle}
                onValueChange={(value) => setFontStyle((value as string) ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Font stili seçin">{fontStyle}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {fontItems.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Brend rəngləri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="size-4 text-indigo-500" />
              Brend rəngləri
            </CardTitle>
            <CardDescription>Vizual kontentdə istifadə olunan rənglər</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorField
              id="bk-primary"
              label="Əsas rəng"
              value={primaryColor}
              fallback="#4f46e5"
              onChange={setPrimaryColor}
            />
            <ColorField
              id="bk-secondary"
              label="İkinci rəng"
              value={secondaryColor}
              fallback="#f59e0b"
              onChange={setSecondaryColor}
            />
            <div className="rounded-lg border border-zinc-100 p-3">
              <div className="text-xs font-medium text-zinc-500">Rəng nümunəsi</div>
              <div className="mt-2 flex gap-2">
                <div
                  className="flex h-12 flex-1 items-center justify-center rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor: safePrimary }}
                >
                  Əsas
                </div>
                <div
                  className="flex h-12 flex-1 items-center justify-center rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor: safeSecondary }}
                >
                  İkinci
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Əlaqə məlumatları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="size-4 text-indigo-500" />
              Əlaqə məlumatları
            </CardTitle>
            <CardDescription>Elanlarda və postlarda göstərilən kontaktlar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bk-phone">Telefon</Label>
              <Input
                id="bk-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+994 50 123 45 67"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-whatsapp">WhatsApp linki</Label>
              <Input
                id="bk-whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="https://wa.me/994501234567"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-instagram">Instagram</Label>
              <Input
                id="bk-instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@biznesiniz"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-address">Ünvan</Label>
              <Input
                id="bk-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Bakı şəh., ..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Qaydalar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4 text-indigo-500" />
              Çatdırılma və zəmanət qaydaları
            </CardTitle>
            <CardDescription>Kontentlərə avtomatik əlavə olunan standart şərtlər</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bk-delivery" className="flex items-center gap-1.5">
                <Truck className="size-3.5 text-zinc-400" />
                Çatdırılma qaydası
              </Label>
              <Textarea
                id="bk-delivery"
                value={deliveryPolicy}
                onChange={(e) => setDeliveryPolicy(e.target.value)}
                placeholder="məs. Bakı daxili pulsuz çatdırılma, bölgələrə 1-3 iş günü"
                className="min-h-20"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-warranty" className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-zinc-400" />
                Zəmanət qaydası
              </Label>
              <Textarea
                id="bk-warranty"
                value={warrantyPolicy}
                onChange={(e) => setWarrantyPolicy(e.target.value)}
                placeholder="məs. Bütün məhsullara 12 ay rəsmi zəmanət"
                className="min-h-20"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standart satış mesajları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="size-4 text-indigo-500" />
            Standart satış mesajları
          </CardTitle>
          <CardDescription>
            Postların sonuna əlavə olunan çağırış cümlələri (CTA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {salesMessages.length === 0 && (
            <p className="text-sm text-zinc-400">
              Hələ satış mesajı yoxdur. Aşağıdakı düymə ilə əlavə edin.
            </p>
          )}
          {salesMessages.map((message, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) =>
                  setSalesMessages((prev) =>
                    prev.map((m, i) => (i === index ? e.target.value : m))
                  )
                }
                placeholder="məs. Sifariş üçün WhatsApp-a yazın 📲"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  setSalesMessages((prev) => prev.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="size-4 text-red-500" />
                <span className="sr-only">Mesajı sil</span>
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSalesMessages((prev) => [...prev, ""])}
          >
            <Plus />
            Mesaj əlavə et
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          Yadda saxla
        </Button>
      </div>
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  fallback,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const pickerValue = HEX_RE.test(value) ? value : fallback;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} seçimi`}
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-white p-0.5"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          className="font-mono uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}
