"use client";

import * as React from "react";
import { toast } from "sonner";
import { LayoutTemplate, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Template } from "@/lib/db/schema";
import { TEMPLATE_TYPES, formatDate, type TemplateTypeKey } from "@/lib/constants";
import { deleteTemplate, toggleDefault } from "@/lib/actions/templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterPill } from "@/components/shared/filter-pills";
import { PageHeader } from "@/components/shared/page-header";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { TemplateDialog } from "@/components/templates/template-dialog";
import { cn } from "@/lib/utils";

const TYPE_KEYS = Object.keys(TEMPLATE_TYPES) as TemplateTypeKey[];

export function TemplatesView({ items }: { items: Template[] }) {
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Template | null>(null);
  const [deleting, setDeleting] = React.useState<Template | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const filtered =
    typeFilter === "all" ? items : items.filter((t) => t.type === typeFilter);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(template: Template) {
    setEditing(template);
    setDialogOpen(true);
  }

  async function handleToggleDefault(template: Template) {
    const result = await toggleDefault(template.id);
    if (result.success) {
      toast.success(
        template.isDefault
          ? "Standart statusu götürüldü"
          : "Standart şablon olaraq təyin edildi"
      );
    } else {
      toast.error(result.error ?? "Xəta baş verdi");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const result = await deleteTemplate(deleting.id);
      if (result.success) {
        toast.success("Şablon silindi");
        setDeleting(null);
      } else {
        toast.error(result.error ?? "Xəta baş verdi");
      }
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Şablonlar"
        description="Kontent yaradılarkən istifadə olunan hazır mətn şablonları. Dəyişənlər real məhsul məlumatları ilə əvəz olunur."
      >
        <Button onClick={openCreate}>
          <Plus />
          Yeni şablon
        </Button>
      </PageHeader>

      {/* Tip üzrə filtr pill-ləri */}
      <div className="flex flex-wrap gap-1.5">
        <FilterPill
          active={typeFilter === "all"}
          onClick={() => setTypeFilter("all")}
          label="Hamısı"
          count={items.length}
        />
        {TYPE_KEYS.map((key) => {
          const count = items.filter((t) => t.type === key).length;
          if (count === 0) return null;
          return (
            <FilterPill
              key={key}
              active={typeFilter === key}
              onClick={() => setTypeFilter(key)}
              label={TEMPLATE_TYPES[key].label}
              count={count}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="size-10" />}
          title="Şablon tapılmadı"
          description="Bu tip üzrə hələ şablon yoxdur. Yeni şablon yaradın."
          action={
            <Button onClick={openCreate}>
              <Plus />
              Yeni şablon
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((template) => (
            <Card key={template.id} className="flex flex-col gap-3 py-4">
              <CardHeader className="px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-zinc-900">
                      {template.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="border-zinc-200 text-zinc-600">
                        {TEMPLATE_TYPES[template.type as TemplateTypeKey]?.label ??
                          template.type}
                      </Badge>
                      {template.platform && <PlatformBadge platform={template.platform} />}
                      {template.isDefault === 1 && (
                        <Badge className="gap-1 border-amber-200 bg-amber-50 text-amber-700">
                          <Star className="size-3 fill-current" />
                          Standart
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 px-4">
                <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3">
                  <p className="line-clamp-6 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-zinc-600">
                    {template.content}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between px-4">
                <span className="text-[11px] text-zinc-400">
                  {formatDate(template.createdAt)}
                </span>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleDefault(template)}
                        />
                      }
                    >
                      <Star
                        className={cn(
                          "size-4",
                          template.isDefault === 1
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-400"
                        )}
                      />
                      <span className="sr-only">Standart et</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {template.isDefault === 1
                        ? "Standart statusunu götür"
                        : "Standart şablon et"}
                    </TooltipContent>
                  </Tooltip>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(template)}>
                    <Pencil className="size-4 text-zinc-500" />
                    <span className="sr-only">Redaktə et</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleting(template)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                    <span className="sr-only">Sil</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Yarat / redaktə dialoqu */}
      <TemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} template={editing} />

      {/* Silmə təsdiqi */}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şablonu sil</DialogTitle>
            <DialogDescription>
              {deleting
                ? `"${deleting.name}" şablonunu silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteBusy}>
              Ləğv et
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteBusy}>
              <Trash2 />
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

