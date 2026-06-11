"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Product } from "@/lib/db/schema";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import {
  createProduct,
  updateProduct,
  type ProductFormValues,
  type SpecRow,
} from "@/lib/actions/products";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormState {
  name: string;
  brand: string;
  model: string;
  category: string;
  price: string;
  salePrice: string;
  stock: string;
  warranty: string;
  color: string;
  size: string;
  delivery: string;
  note: string;
  imagesText: string;
  specs: SpecRow[];
}

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function toNumber(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

const CATEGORY_ITEMS = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c, c])
);

export function ProductForm({ product }: { product?: Product }) {
  const [isPending, startTransition] = useTransition();

  const initialSpecs = product
    ? parseJsonArray<SpecRow>(product.specs)
    : [];
  const initialImages = product ? parseJsonArray<string>(product.images) : [];

  const [form, setForm] = useState<FormState>({
    name: product?.name ?? "",
    brand: product?.brand ?? "",
    model: product?.model ?? "",
    category: product?.category ?? "Digər",
    price: product?.price != null ? String(product.price) : "",
    salePrice: product?.salePrice != null ? String(product.salePrice) : "",
    stock: product?.stock != null ? String(product.stock) : "",
    warranty: product?.warranty ?? "",
    color: product?.color ?? "",
    size: product?.size ?? "",
    delivery: product?.delivery ?? "",
    note: product?.note ?? "",
    imagesText: initialImages.join("\n"),
    specs: initialSpecs.length > 0 ? initialSpecs : [{ name: "", value: "" }],
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSpec(index: number, field: keyof SpecRow, value: string) {
    setForm((prev) => ({
      ...prev,
      specs: prev.specs.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  }

  function addSpec() {
    setForm((prev) => ({
      ...prev,
      specs: [...prev.specs, { name: "", value: "" }],
    }));
  }

  function removeSpec(index: number) {
    setForm((prev) => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Məhsulun adını daxil edin");
      return;
    }

    const stockNumber = toNumber(form.stock);
    const values: ProductFormValues = {
      name: form.name,
      brand: form.brand,
      model: form.model,
      category: form.category,
      price: toNumber(form.price),
      salePrice: toNumber(form.salePrice),
      stock: stockNumber == null ? null : Math.max(0, Math.round(stockNumber)),
      warranty: form.warranty,
      color: form.color,
      size: form.size,
      delivery: form.delivery,
      note: form.note,
      images: form.imagesText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      specs: form.specs,
    };

    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, values)
        : await createProduct(values);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  const cancelHref = product ? `/mehsullar/${product.id}` : "/mehsullar";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Əsas məlumatlar</CardTitle>
          <CardDescription>
            Məhsulun adı, markası və qiymət məlumatları
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">
              Məhsulun adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="məs. Samsung Galaxy S24 Ultra 256GB"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Marka</Label>
            <Input
              id="brand"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="məs. Samsung"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="məs. Galaxy S24 Ultra"
            />
          </div>
          <div className="space-y-2">
            <Label>Kateqoriya</Label>
            <Select
              items={CATEGORY_ITEMS}
              value={form.category}
              onValueChange={(v) => set("category", (v as string) ?? "Digər")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stok (ədəd)</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Qiymət (₼)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salePrice">Endirimli qiymət (₼)</Label>
            <Input
              id="salePrice"
              type="number"
              min={0}
              step="0.01"
              value={form.salePrice}
              onChange={(e) => set("salePrice", e.target.value)}
              placeholder="boş buraxsanız endirim olmayacaq"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Əlavə məlumatlar</CardTitle>
          <CardDescription>
            Zəmanət, çatdırılma və digər detallar
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="warranty">Zəmanət</Label>
            <Input
              id="warranty"
              value={form.warranty}
              onChange={(e) => set("warranty", e.target.value)}
              placeholder="məs. 12 ay rəsmi zəmanət"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Rəng</Label>
            <Input
              id="color"
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
              placeholder="məs. Titan boz"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Ölçü</Label>
            <Input
              id="size"
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
              placeholder="məs. 6.8 düym / XL"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery">Çatdırılma</Label>
            <Input
              id="delivery"
              value={form.delivery}
              onChange={(e) => set("delivery", e.target.value)}
              placeholder="məs. Bakı daxili pulsuz çatdırılma"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">Qeyd</Label>
            <Textarea
              id="note"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Daxili qeydlər (alıcıya görünmür)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Texniki göstəricilər</CardTitle>
          <CardDescription>
            AI kontent yaradarkən bu göstəricilərdən istifadə edəcək
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.specs.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={row.name}
                onChange={(e) => updateSpec(i, "name", e.target.value)}
                placeholder="Göstərici (məs. Yaddaş)"
                aria-label={`Göstərici ${i + 1} adı`}
              />
              <Input
                value={row.value}
                onChange={(e) => updateSpec(i, "value", e.target.value)}
                placeholder="Dəyər (məs. 256 GB)"
                aria-label={`Göstərici ${i + 1} dəyəri`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Sətri sil"
                onClick={() => removeSpec(i)}
                className="shrink-0 text-zinc-400 hover:text-red-600"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addSpec}>
            <Plus />
            Göstərici əlavə et
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Şəkillər</CardTitle>
          <CardDescription>
            Şəkil URL-lərini vergüllə və ya hər sətirdə bir URL olmaqla daxil
            edin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.imagesText}
            onChange={(e) => set("imagesText", e.target.value)}
            placeholder={"https://example.com/sekil-1.jpg\nhttps://example.com/sekil-2.jpg"}
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          render={<Link href={cancelHref} />}
        >
          Ləğv et
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Save />}
          {isPending
            ? "Yadda saxlanılır..."
            : product
              ? "Yadda saxla"
              : "Məhsulu əlavə et"}
        </Button>
      </div>
    </form>
  );
}
