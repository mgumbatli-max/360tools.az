"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "hamisi";

const STATUS_ITEMS: Record<string, string> = {
  [ALL]: "Bütün statuslar",
  aktiv: "Aktiv",
  arxiv: "Arxiv",
};

const CATEGORY_ITEMS: Record<string, string> = {
  [ALL]: "Bütün kateqoriyalar",
  ...Object.fromEntries(PRODUCT_CATEGORIES.map((c) => [c, c])),
};

export function ProductFilters({ brands }: { brands: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const brandItems: Record<string, string> = {
    [ALL]: "Bütün markalar",
    ...Object.fromEntries(brands.map((b) => [b, b])),
  };

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search.trim() === current) return;
    const timer = setTimeout(() => {
      setParam("q", search.trim() || null);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters =
    Boolean(searchParams.get("q")) ||
    Boolean(searchParams.get("kateqoriya")) ||
    Boolean(searchParams.get("marka")) ||
    Boolean(searchParams.get("status"));

  function resetFilters() {
    setSearch("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ad və ya marka üzrə axtar..."
          className="pl-8"
          aria-label="Məhsul axtarışı"
        />
      </div>

      <Select
        items={CATEGORY_ITEMS}
        value={searchParams.get("kateqoriya") ?? ALL}
        onValueChange={(v) => setParam("kateqoriya", (v as string) ?? null)}
      >
        <SelectTrigger className="w-48" aria-label="Kateqoriya filtri">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(CATEGORY_ITEMS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={brandItems}
        value={searchParams.get("marka") ?? ALL}
        onValueChange={(v) => setParam("marka", (v as string) ?? null)}
      >
        <SelectTrigger className="w-40" aria-label="Marka filtri">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(brandItems).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={STATUS_ITEMS}
        value={searchParams.get("status") ?? ALL}
        onValueChange={(v) => setParam("status", (v as string) ?? null)}
      >
        <SelectTrigger className="w-36" aria-label="Status filtri">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_ITEMS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <X />
          Filtri sıfırla
        </Button>
      )}
    </div>
  );
}
