"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
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
import { deleteContent } from "@/lib/actions/contents";

export function DeleteContentButton({
  contentId,
  title,
}: {
  contentId: number;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteContent(contentId);
      toast.success("Elan silindi");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>
        <Trash2 />
        Sil
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Elanı silmək istəyirsiniz?</DialogTitle>
          <DialogDescription>
            “{title}” elanı birdəfəlik silinəcək. Bu əməliyyat geri qaytarıla
            bilməz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Ləğv et
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Bəli, sil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
