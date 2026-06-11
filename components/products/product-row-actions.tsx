"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { deleteProduct, toggleArchive } from "@/lib/actions/products";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductRowActionsProps {
  id: number;
  name: string;
  status: string;
}

export function ProductRowActions({ id, name, status }: ProductRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggleArchive() {
    startTransition(async () => {
      const result = await toggleArchive(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          status === "aktiv" ? "Məhsul arxivləndi" : "Məhsul aktivləşdirildi"
        );
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Məhsul silindi");
        setConfirmOpen(false);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Əməliyyatlar" />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem render={<Link href={`/mehsullar/${id}`} />}>
            <Eye />
            Bax
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href={`/mehsullar/${id}/redakte`} />}
          >
            <Pencil />
            Redaktə et
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleArchive} disabled={isPending}>
            {status === "aktiv" ? (
              <>
                <Archive />
                Arxivlə
              </>
            ) : (
              <>
                <ArchiveRestore />
                Aktivləşdir
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={(open) => setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Məhsulu sil</DialogTitle>
            <DialogDescription>
              &ldquo;{name}&rdquo; məhsulu və ona bağlı bütün kontentlər
              silinəcək. Bu əməliyyat geri qaytarıla bilməz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Ləğv et
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
