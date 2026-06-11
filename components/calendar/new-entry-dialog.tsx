"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CALENDAR_ENTRY_TYPES, PLATFORMS } from "@/lib/constants";
import { createEntry } from "@/lib/actions/calendar";

const NO_PLATFORM = "none";

const TYPE_ITEMS: Record<string, string> = Object.fromEntries(
  Object.entries(CALENDAR_ENTRY_TYPES).map(([key, meta]) => [key, meta.label])
);

const PLATFORM_ITEMS: Record<string, string> = {
  [NO_PLATFORM]: "Platforma seçilməyib",
  ...Object.fromEntries(
    Object.entries(PLATFORMS).map(([key, meta]) => [key, `${meta.icon} ${meta.label}`])
  ),
};

export function NewEntryDialog({ defaultDate }: { defaultDate: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("post");
  const [platform, setPlatform] = useState(NO_PLATFORM);
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle("");
    setType("post");
    setPlatform(NO_PLATFORM);
    setDate(defaultDate);
    setNote("");
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("Başlıq daxil edin");
      return;
    }
    if (!date) {
      toast.error("Tarix seçin");
      return;
    }
    startTransition(async () => {
      const res = await createEntry({
        title: title.trim(),
        type,
        platform: platform === NO_PLATFORM ? null : platform,
        date,
        note: note.trim() || null,
      });
      if (res.ok) {
        toast.success("Plan təqvimə əlavə olundu");
        setOpen(false);
        resetForm();
      } else {
        toast.error(res.error ?? "Xəta baş verdi");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Yeni plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni plan</DialogTitle>
            <DialogDescription>Kontent təqviminə yeni paylaşım planı əlavə edin.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="entry-title">Başlıq</Label>
              <Input
                id="entry-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Məs.: iPhone 16 endirim postu"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tip</Label>
                <Select
                  items={TYPE_ITEMS}
                  value={type}
                  onValueChange={(v) => setType((v as string) ?? "post")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tip seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_ITEMS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Platforma</Label>
                <Select
                  items={PLATFORM_ITEMS}
                  value={platform}
                  onValueChange={(v) => setPlatform((v as string) ?? NO_PLATFORM)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Platforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_ITEMS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-date">Tarix</Label>
              <Input
                id="entry-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry-note">Qeyd</Label>
              <Textarea
                id="entry-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Əlavə qeyd (istəyə bağlı)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Ləğv et
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Əlavə olunur…" : "Əlavə et"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
