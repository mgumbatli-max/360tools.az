"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
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
import { updateContent } from "@/lib/actions/contents";

interface EditContentDialogProps {
  contentId: number;
  title: string;
  body: string;
  hashtags: string[];
}

export function EditContentDialog({
  contentId,
  title,
  body,
  hashtags,
}: EditContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextTitle = String(formData.get("title") ?? "").trim();
    const nextBody = String(formData.get("body") ?? "").trim();
    const nextHashtags = String(formData.get("hashtags") ?? "")
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#+/, "").trim())
      .filter(Boolean);

    startTransition(async () => {
      const result = await updateContent(contentId, {
        title: nextTitle,
        body: nextBody,
        hashtags: nextHashtags,
      });
      if (result.ok) {
        toast.success("Elan yeniləndi");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Xəta baş verdi");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil />
        Redaktə et
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Elanı redaktə et</DialogTitle>
          <DialogDescription>
            Başlıq, mətn və hashtagları dəyişə bilərsiniz.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Başlıq</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={title}
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-body">Mətn</Label>
            <Textarea
              id="edit-body"
              name="body"
              defaultValue={body}
              required
              rows={10}
              className="max-h-72 min-h-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-hashtags">Hashtaglar</Label>
            <Input
              id="edit-hashtags"
              name="hashtags"
              defaultValue={hashtags.join(" ")}
              placeholder="məs.: telefon baki endirim"
            />
            <p className="text-xs text-zinc-500">
              Boşluq və ya vergüllə ayırın, # işarəsi vacib deyil.
            </p>
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
              Yadda saxla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
