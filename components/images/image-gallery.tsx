"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Crop, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IMAGE_FORMATS, type ImageFormatKey } from "@/lib/constants";
import { removeImage } from "@/lib/actions/images";

const FORMAT_KEYS = Object.keys(IMAGE_FORMATS) as ImageFormatKey[];

export interface GalleryItem {
  productId: number;
  productName: string;
  url: string;
}

export function ImageGallery({ items }: { items: GalleryItem[] }) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(
    items[0]?.url ?? null
  );
  const [isPending, startTransition] = useTransition();

  const selected =
    items.find((item) => item.url === selectedUrl) ?? items[0] ?? null;

  function handleRemove(item: GalleryItem) {
    startTransition(async () => {
      const result = await removeImage(item.productId, item.url);
      if (result.ok) {
        toast.success("Şəkil silindi");
        if (selectedUrl === item.url) setSelectedUrl(null);
      } else {
        toast.error(result.error ?? "Xəta baş verdi");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Qalereya */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => {
          const isSelected = selected?.url === item.url;
          return (
            <div
              key={`${item.productId}-${item.url}`}
              className={cn(
                "group overflow-hidden rounded-xl border bg-white transition-shadow",
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-200"
                  : "border-zinc-200 hover:shadow-sm"
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedUrl(item.url)}
                className="block w-full"
                aria-label={`${item.productName} şəklini seç`}
              >
                <div className="aspect-square w-full overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.productName}
                    loading="lazy"
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              </button>
              <div className="flex items-center justify-between gap-1 p-2.5">
                <span className="truncate text-xs font-medium text-zinc-700">
                  {item.productName}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 text-zinc-400 hover:text-red-600"
                  aria-label="Şəkli sil"
                  disabled={isPending}
                  onClick={() => handleRemove(item)}
                >
                  {isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Format presetləri */}
      {selected && (
        <Card className="py-0">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crop className="size-4 text-indigo-600" />
              Format presetləri
            </CardTitle>
            <p className="text-sm text-zinc-500">
              Seçilmiş şəkil: <span className="font-medium">{selected.productName}</span>{" "}
              — hər platforma üçün kəsim önizləməsi
            </p>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {FORMAT_KEYS.map((key) => {
                const format = IMAGE_FORMATS[key];
                return (
                  <div key={key} className="space-y-2">
                    <div
                      className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
                      style={{
                        aspectRatio: `${format.width} / ${format.height}`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selected.url}
                        alt={`${selected.productName} — ${format.label}`}
                        className="size-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-zinc-900">
                          {format.label}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {format.width}×{format.height}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500">{format.usage}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
