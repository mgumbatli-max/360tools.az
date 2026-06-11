"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ListPlus, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITIES, type TaskPriorityKey } from "@/lib/constants";
import { createTask } from "@/lib/actions/team";

const PRIORITY_KEYS = Object.keys(TASK_PRIORITIES) as TaskPriorityKey[];
const NONE = "none";

interface Option {
  id: number;
  name: string;
}

interface NewTaskDialogProps {
  members: Option[];
  products: Option[];
}

const PRIORITY_ITEMS: Record<string, string> = Object.fromEntries(
  PRIORITY_KEYS.map((key) => [key, TASK_PRIORITIES[key].label])
);

export function NewTaskDialog({ members, products }: NewTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [assignee, setAssignee] = useState<string>(
    members[0] ? String(members[0].id) : NONE
  );
  const [productId, setProductId] = useState<string>(NONE);
  const [priority, setPriority] = useState<TaskPriorityKey>("orta");
  const [isPending, startTransition] = useTransition();

  const assigneeItems: Record<string, string> = {
    [NONE]: "Təyin edilməyib",
    ...Object.fromEntries(
      members.map((member) => [String(member.id), member.name])
    ),
  };
  const productItems: Record<string, string> = {
    [NONE]: "Bağlı deyil",
    ...Object.fromEntries(
      products.map((product) => [String(product.id), product.name])
    ),
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const dueDate = String(formData.get("dueDate") ?? "").trim();

    startTransition(async () => {
      const result = await createTask({
        title,
        description: description || undefined,
        assigneeId: assignee === NONE ? null : Number(assignee),
        productId: productId === NONE ? null : Number(productId),
        priority,
        dueDate: dueDate || null,
      });
      if (result.ok) {
        toast.success("Tapşırıq yaradıldı");
        setOpen(false);
        setProductId(NONE);
        setPriority("orta");
      } else {
        toast.error(result.error ?? "Xəta baş verdi");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ListPlus />
        Yeni tapşırıq
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni tapşırıq</DialogTitle>
          <DialogDescription>
            Tapşırığı təsvir edin, icraçı və son tarix təyin edin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Başlıq</Label>
            <Input
              id="task-title"
              name="title"
              placeholder="məs.: Instagram postu hazırla"
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-description">Təsvir</Label>
            <Textarea
              id="task-description"
              name="description"
              placeholder="Tapşırığın detalları…"
              rows={3}
              className="max-h-40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>İcraçı</Label>
              <Select
                items={assigneeItems}
                value={assignee}
                onValueChange={(value) => setAssignee(String(value))}
              >
                <SelectTrigger className="w-full" aria-label="İcraçı seçin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Təyin edilməyib</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={String(member.id)}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Məhsul (istəyə bağlı)</Label>
              <Select
                items={productItems}
                value={productId}
                onValueChange={(value) => setProductId(String(value))}
              >
                <SelectTrigger className="w-full" aria-label="Məhsul seçin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Bağlı deyil</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioritet</Label>
              <Select
                items={PRIORITY_ITEMS}
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriorityKey)}
              >
                <SelectTrigger className="w-full" aria-label="Prioritet seçin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {TASK_PRIORITIES[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Son tarix</Label>
              <Input id="task-due" name="dueDate" type="date" />
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
              Yarat
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
