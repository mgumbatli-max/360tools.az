"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/components/nav-items";

/** Sidebar-ın naviqasiya hissəsi — həm masaüstü panelində, həm mobil Sheet-də işlədilir. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 scrollbar-slim">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label || `group-${gi}`}>
          {group.label && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              {group.label}
            </div>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              // Əsas çağırış düyməsi — qradiyentli, fərqlənən
              if (item.highlight) {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-150 bg-brand-gradient",
                        active ? "ring-2 ring-primary/30" : "hover:opacity-90"
                      )}
                    >
                      <item.icon className="size-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <item.icon
                      className={cn(
                        "size-[18px] shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Logo + ad blokunun yuxarı hissəsi. */
export function SidebarBrand() {
  return (
    <Link href="/" className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
      <div className="bg-brand-gradient flex size-9 items-center justify-center rounded-xl text-[13px] font-bold text-white shadow-soft">
        360
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight text-foreground">
          tools<span className="text-brand">.az</span>
        </div>
        <div className="text-[11px] text-muted-foreground">AI Kontent Platforması</div>
      </div>
    </Link>
  );
}

/** Masaüstü üçün sabit yan panel. */
export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarBrand />
      <SidebarNav />
      <div className="border-t border-sidebar-border p-3">
        <div className="relative overflow-hidden rounded-xl bg-brand-gradient p-4 text-white shadow-soft">
          <div className="relative z-10">
            <div className="text-sm font-semibold">Pro paketə keçin</div>
            <p className="mt-0.5 text-xs text-white/80">
              Limitsiz AI kontent, marketplace formatları və komanda işi.
            </p>
            <Link
              href="/ayarlar"
              className="mt-3 inline-flex items-center rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-white/25"
            >
              Ətraflı
            </Link>
          </div>
          <div className="absolute -right-6 -bottom-8 size-24 rounded-full bg-white/10 blur-xl" />
        </div>
      </div>
    </aside>
  );
}
