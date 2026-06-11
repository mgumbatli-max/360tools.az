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

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
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

/** Pathname-ə görə cari bölmənin elementini (ad + ikon) tapır (üst panel başlığı üçün). */
export function findNavItem(pathname: string): NavItem | null {
  let best: { item: NavItem; len: number } | null = null;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const match = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
      if (match && (!best || item.href.length > best.len)) {
        best = { item, len: item.href.length };
      }
    }
  }
  return best?.item ?? null;
}
