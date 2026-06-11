"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarBrand, SidebarNav } from "@/components/app-sidebar";
import { findNavLabel } from "@/components/nav-items";

export function AppTopbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = findNavLabel(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Mobil menyu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menyu" />
          }
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Naviqasiya</SheetTitle>
          <SidebarBrand />
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="text-[15px] font-semibold tracking-tight text-foreground lg:text-base">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/ai-studio"
          className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-soft transition hover:text-foreground sm:flex"
        >
          <Search className="size-4" />
          <span>AI Studio-da axtar…</span>
        </Link>
        <Button render={<Link href="/mehsullar/yeni" />} className="gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Yeni məhsul</span>
        </Button>
        <Avatar className="size-9 border border-border">
          <AvatarFallback className="bg-brand-gradient text-xs font-semibold text-white">
            MQ
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
