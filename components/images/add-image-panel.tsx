"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ImagePlus, Link2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { addImageUrl, uploadImage } from "@/lib/actions/images";

interface ProductOption {
  id: number;
  name: string;
}

export function AddImagePanel({ products }: { products: ProductOption[] }) {
  const [productId, setProductId] = useState<string>(
    products[0] ? String(products[0].id) : ""
  );
  const productItems: Record<string, string> = Object.fromEntries(
    products.map((product) => [String(product.id), product.name])
  );
  const [isPending, startTransition] = useTransition();
  const urlInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAddUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productId) {
      toast.error("Əvvəlcə məhsul seçin");
      return;
    }
    const url = urlInputRef.current?.value.trim() ?? "";
    if (!url) {
      toast.error("Şəkil URL-i daxil edin");
      return;
    }
    startTransition(async () => {
      try {
        const result = await addImageUrl(Number(productId), url);
        if (result.ok) {
          toast.success("Şəkil əlavə olundu");
          if (urlInputRef.current) urlInputRef.current.value = "";
        } else {
          toast.error(result.error ?? "Xəta baş verdi");
        }
      } catch {
        toast.error("Şəkil əlavə olunmadı — yenidən cəhd edin");
      }
    });
  }

  function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productId) {
      toast.error("Əvvəlcə məhsul seçin");
      return;
    }
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Fayl seçin");
      return;
    }
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("file", file);
    startTransition(async () => {
      try {
        const result = await uploadImage(formData);
        if (result.ok) {
          toast.success("Şəkil yükləndi");
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          toast.error(result.error ?? "Xəta baş verdi");
        }
      } catch {
        toast.error(
          "Şəkil yüklənmədi — fayl 8 MB-dan böyük ola bilər və ya server xətası baş verdi"
        );
      }
    });
  }

  return (
    <Card className="py-0">
      <CardHeader className="px-5 pt-5 pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ImagePlus className="size-4 text-indigo-600" />
          Şəkil əlavə et
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label>Məhsul</Label>
          <Select
            items={productItems}
            value={productId}
            onValueChange={(value) => setProductId(String(value))}
          >
            <SelectTrigger
              className="w-full sm:w-80"
              aria-label="Məhsul seçin"
              disabled={products.length === 0}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={String(product.id)}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {products.length === 0 && (
            <p className="text-xs text-zinc-500">
              Şəkil əlavə etmək üçün əvvəlcə məhsul yaradın.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <form onSubmit={handleAddUrl} className="space-y-1.5">
            <Label htmlFor="image-url">URL ilə əlavə et</Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                ref={urlInputRef}
                type="url"
                placeholder="https://nümunə.az/sekil.jpg"
                className="flex-1"
                disabled={isPending || products.length === 0}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={isPending || products.length === 0}
              >
                {isPending ? <Loader2 className="animate-spin" /> : <Link2 />}
                Əlavə et
              </Button>
            </div>
          </form>

          <div className="hidden items-center lg:flex">
            <Separator orientation="vertical" className="h-12" />
          </div>

          <form onSubmit={handleUpload} className="space-y-1.5">
            <Label htmlFor="image-file">Fayl yüklə</Label>
            <div className="flex gap-2">
              <Input
                id="image-file"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="flex-1"
                disabled={isPending || products.length === 0}
              />
              <Button
                type="submit"
                disabled={isPending || products.length === 0}
              >
                {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
                Yüklə
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
