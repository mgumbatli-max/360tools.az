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
import { CAMPAIGN_TYPES } from "@/lib/constants";
import { createCampaign } from "@/lib/actions/campaigns";

const TYPE_ITEMS: Record<string, string> = Object.fromEntries(
  Object.entries(CAMPAIGN_TYPES).map(([key, meta]) => [key, meta.label])
);

export function NewCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("endirim");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setName("");
    setType("endirim");
    setDescription("");
    setStartDate("");
    setEndDate("");
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Kampaniya adını daxil edin");
      return;
    }
    startTransition(async () => {
      const res = await createCampaign({
        name: name.trim(),
        type,
        description: description.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      if (res.ok) {
        toast.success("Kampaniya yaradıldı");
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
        Yeni kampaniya
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni kampaniya</DialogTitle>
            <DialogDescription>
              Satış kampaniyası yaradın və sonra AI ilə kontent ideyaları əldə edin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name">Ad</Label>
              <Input
                id="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Məs.: Yay endirimi 2026"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tip</Label>
              <Select
                items={TYPE_ITEMS}
                value={type}
                onValueChange={(v) => setType((v as string) ?? "endirim")}
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
              <Label htmlFor="campaign-description">Təsvir</Label>
              <Textarea
                id="campaign-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kampaniyanın məqsədi və əhatə etdiyi məhsullar (istəyə bağlı)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="campaign-start">Başlama tarixi</Label>
                <Input
                  id="campaign-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign-end">Bitmə tarixi</Label>
                <Input
                  id="campaign-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Ləğv et
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Yaradılır…" : "Yarat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
