"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, PLATFORMS, PLATFORM_KEYS } from "@/lib/constants";

const ALL = "hamisi";

const PLATFORM_ITEMS: Record<string, string> = {
  [ALL]: "Bütün platformalar",
  ...Object.fromEntries(
    PLATFORM_KEYS.map((key) => [
      key,
      `${PLATFORMS[key].icon} ${PLATFORMS[key].label}`,
    ])
  ),
};

const LANGUAGE_ITEMS: Record<string, string> = {
  [ALL]: "Bütün dillər",
  ...Object.fromEntries(
    Object.entries(LANGUAGES).map(([key, meta]) => [key, meta.label])
  ),
};

interface ListingsFiltersProps {
  platform?: string;
  language?: string;
  q?: string;
}

export function ListingsFilters({ platform, language, q }: ListingsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParams(updates: Record<string, string | undefined>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    const qs = sp.toString();
    router.push(qs ? `/elanlar?${qs}` : "/elanlar");
  }

  const hasFilters = Boolean(platform || language || q);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          const value = String(new FormData(event.currentTarget).get("q") ?? "");
          setParams({ q: value.trim() || undefined });
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Başlıq və ya məhsul axtar…"
          className="w-64 pl-8"
          aria-label="Axtarış"
        />
      </form>

      <Select
        items={PLATFORM_ITEMS}
        value={platform ?? ALL}
        onValueChange={(value) =>
          setParams({ platform: value === ALL ? undefined : String(value) })
        }
      >
        <SelectTrigger className="w-52" aria-label="Platforma filtri">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Bütün platformalar</SelectItem>
          {PLATFORM_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {PLATFORMS[key].icon} {PLATFORMS[key].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={LANGUAGE_ITEMS}
        value={language ?? ALL}
        onValueChange={(value) =>
          setParams({ language: value === ALL ? undefined : String(value) })
        }
      >
        <SelectTrigger className="w-44" aria-label="Dil filtri">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Bütün dillər</SelectItem>
          {(Object.keys(LANGUAGES) as (keyof typeof LANGUAGES)[]).map((key) => (
            <SelectItem key={key} value={key}>
              {LANGUAGES[key].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setParams({ platform: undefined, language: undefined, q: undefined })
          }
        >
          <X />
          Filtri təmizlə
        </Button>
      )}
    </div>
  );
}
