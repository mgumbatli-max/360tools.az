"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePlan } from "@/lib/actions/calendar";
import type { PlatformOption } from "@/lib/platforms";

const DURATION_ITEMS: Record<string, string> = { "14": "14 gün", "30": "30 gün", "60": "60 gün" };
const PERWEEK_ITEMS: Record<string, string> = {
  "3": "Həftədə 3 paylaşım",
  "5": "Həftədə 5 paylaşım",
  "7": "Hər gün",
};

export function GeneratePlanDialog({
  defaultDate,
  platforms,
}: {
  defaultDate: string;
  platforms: PlatformOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(defaultDate);
  const [days, setDays] = useState("30");
  const [perWeek, setPerWeek] = useState("5");
  const [skipExisting, setSkipExisting] = useState(true);
  const [selected, setSelected] = useState<string[]>(
    platforms.slice(0, 3).map((p) => p.key)
  );
  const [isPending, startTransition] = useTransition();

  function toggle(key: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)));
  }

  function onGenerate() {
    if (selected.length === 0) {
      toast.error("Ən azı bir platforma seçin");
      return;
    }
    startTransition(async () => {
      const result = await generatePlan({
        startDate,
        days: Number(days),
        perWeek: Number(perWeek),
        platforms: selected,
        skipExisting,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${result.created} paylaşım planlandı${result.skipped > 0 ? ` (${result.skipped} gün ötürüldü)` : ""}`
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Sparkles />
        Plan yarat
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>AI kontent planı yarat</DialogTitle>
          <DialogDescription>
            Məhsullarınız üzərində balanslı paylaşım təqvimi avtomatik qurulur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Başlanğıc tarix</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Müddət</Label>
              <Select items={DURATION_ITEMS} value={days} onValueChange={(v) => setDays(v ?? "30")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DURATION_ITEMS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tezlik</Label>
            <Select items={PERWEEK_ITEMS} value={perWeek} onValueChange={(v) => setPerWeek(v ?? "5")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PERWEEK_ITEMS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Platformalar</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {platforms.map((p) => (
                <label
                  key={p.key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={selected.includes(p.key)}
                    onCheckedChange={(c) => toggle(p.key, c === true)}
                  />
                  <span aria-hidden>{p.icon}</span>
                  <span className="truncate">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
            <span className="text-sm font-medium">Planlanmış günləri ötür</span>
            <Switch checked={skipExisting} onCheckedChange={setSkipExisting} />
          </label>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Ləğv et</DialogClose>
          <Button onClick={onGenerate} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Planı yarat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
