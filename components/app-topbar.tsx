"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarBrand, SidebarNav } from "@/components/app-sidebar";
import { findNavItem } from "@/components/nav-items";

export function AppTopbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navItem = findNavItem(pathname);
  const title = navItem?.label ?? "360tools";
  const Icon = navItem?.icon;

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

      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="hidden size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:flex">
            <Icon className="size-[18px]" />
          </div>
        )}
        <h1 className="text-[15px] font-semibold tracking-tight text-foreground lg:text-base">
          {title}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button render={<Link href="/yarat" />} className="gap-1.5">
          <Sparkles className="size-4" />
          <span className="hidden sm:inline">Kontent yarat</span>
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
