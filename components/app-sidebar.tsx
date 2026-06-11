"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Megaphone,
  Image as ImageIcon,
  LayoutTemplate,
  CalendarDays,
  Rocket,
  Plug,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}[] = [
  {
    label: "Əsas",
    items: [
      { href: "/", label: "İdarə paneli", icon: LayoutDashboard },
      { href: "/mehsullar", label: "Məhsullar", icon: Package },
      { href: "/ai-studio", label: "AI Studio", icon: Sparkles },
      { href: "/elanlar", label: "Elanlar", icon: Megaphone },
      { href: "/sekiller", label: "Şəkillər", icon: ImageIcon },
    ],
  },
  {
    label: "Planlama",
    items: [
      { href: "/sablonlar", label: "Şablonlar", icon: LayoutTemplate },
      { href: "/teqvim", label: "Kontent təqvimi", icon: CalendarDays },
      { href: "/kampaniyalar", label: "Kampaniyalar", icon: Rocket },
    ],
  },
  {
    label: "İdarəetmə",
    items: [
      { href: "/platformalar", label: "Platformalar", icon: Plug },
      { href: "/komanda", label: "Komanda", icon: Users },
      { href: "/analitika", label: "Analitika", icon: BarChart3 },
      { href: "/ayarlar", label: "Ayarlar", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-zinc-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          360
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-zinc-900">360tools.az</div>
          <div className="text-[11px] text-zinc-500">AI Kontent Platforması</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-4">
        <div className="rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-500">
          <span className="font-medium text-zinc-700">Pro paket</span> — limitsiz AI
          kontent və marketplace formatları
        </div>
      </div>
    </aside>
  );
}
