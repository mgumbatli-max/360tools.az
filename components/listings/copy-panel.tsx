"use client";

import { toast } from "sonner";
import { ClipboardCopy, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyPanelProps {
  title: string;
  body: string;
  hashtags: string[];
}

export function CopyPanel({ title, body, hashtags }: CopyPanelProps) {
  const hashtagLine = hashtags.map((tag) => `#${tag}`).join(" ");

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Kopyalandı");
    } catch {
      toast.error("Kopyalama alınmadı");
    }
  }

  const rows = [
    { label: "Başlıq", value: title },
    { label: "Mətn", value: body },
    ...(hashtagLine ? [{ label: "Hashtaglar", value: hashtagLine }] : []),
  ];

  const fullText = [title, body, hashtagLine].filter(Boolean).join("\n\n");

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
        >
          <div className="min-w-0">
            <div className="text-xs font-medium text-zinc-500">{row.label}</div>
            <div className="mt-0.5 line-clamp-2 text-sm break-words text-zinc-800">
              {row.value}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 bg-white"
            onClick={() => copy(row.value)}
          >
            <Copy />
            Kopyala
          </Button>
        </div>
      ))}
      <Button className="w-full" onClick={() => copy(fullText)}>
        <ClipboardCopy />
        Hamısını kopyala
      </Button>
    </div>
  );
}
