"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TEAM_ROLES, type TeamRoleKey } from "@/lib/constants";
import { addMember } from "@/lib/actions/team";

const ROLE_KEYS = Object.keys(TEAM_ROLES) as TeamRoleKey[];

const ROLE_ITEMS: Record<string, string> = Object.fromEntries(
  ROLE_KEYS.map((key) => [key, TEAM_ROLES[key].label])
);

const AVATAR_COLORS = [
  "#4f46e5",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#475569",
] as const;

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<TeamRoleKey>("content-manager");
  const [color, setColor] = useState<string>(AVATAR_COLORS[0]);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    startTransition(async () => {
      const result = await addMember({
        name,
        email: email || undefined,
        role,
        avatarColor: color,
      });
      if (result.ok) {
        toast.success("Üzv əlavə olundu");
        setOpen(false);
        setRole("content-manager");
        setColor(AVATAR_COLORS[0]);
      } else {
        toast.error(result.error ?? "Xəta baş verdi");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <UserPlus />
        Üzv əlavə et
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni komanda üzvü</DialogTitle>
          <DialogDescription>
            Komandaya yeni üzv əlavə edin və rolunu təyin edin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="member-name">Ad</Label>
            <Input
              id="member-name"
              name="name"
              placeholder="məs.: Aysel Məmmədova"
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-email">E-poçt</Label>
            <Input
              id="member-email"
              name="email"
              type="email"
              placeholder="aysel@nümunə.az"
              maxLength={150}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select
              items={ROLE_ITEMS}
              value={role}
              onValueChange={(value) => setRole(value as TeamRoleKey)}
            >
              <SelectTrigger className="w-full" aria-label="Rol seçin">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {TEAM_ROLES[key].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Avatar rəngi</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Rəng ${value}`}
                  onClick={() => setColor(value)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    color === value
                      ? "scale-110 border-zinc-900"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Ləğv et
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Əlavə et
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
