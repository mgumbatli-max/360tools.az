"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PLATFORM_GROUPS } from "@/lib/constants";
import { createPlatform } from "@/lib/actions/platforms";

const GROUP_ITEMS: Record<string, string> = Object.fromEntries(
  Object.entries(PLATFORM_GROUPS).map(([key, meta]) => [key, meta.label])
);

export function AddPlatformDialog() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("📌");
  const [grp, setGrp] = useState("custom");
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    if (!label.trim()) {
      toast.error("Platforma adını yazın");
      return;
    }
    startTransition(async () => {
      const result = await createPlatform({ label, key: label, icon, grp });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      // uğurlu halda action redirect edir; dialoqu bağlayırıq
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Yeni platforma
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni platforma əlavə et</DialogTitle>
          <DialogDescription>
            Öz satış kanalınızı əlavə edin və növbəti addımda sistemi onun qaydalarına öyrədin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Platforma adı</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="məs. Lalafo, Boom.az, öz saytım"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label>İkon</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} className="text-center" />
            </div>
            <div className="space-y-1.5">
              <Label>Qrup</Label>
              <Select items={GROUP_ITEMS} value={grp} onValueChange={(v) => setGrp(v ?? "custom")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GROUP_ITEMS).map(([value, l]) => (
                    <SelectItem key={value} value={value}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Ləğv et</DialogClose>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "Əlavə olunur…" : "Əlavə et və öyrət"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
