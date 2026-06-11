import {
  Home,
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
  highlight?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Əsas",
    items: [
      { href: "/", label: "Ana səhifə", icon: Home },
      { href: "/yarat", label: "Kontent yarat", icon: Sparkles, highlight: true },
      { href: "/mehsullar", label: "Məhsullar", icon: Package },
      { href: "/elanlar", label: "Hazır kontentlər", icon: Megaphone },
    ],
  },
  {
    label: "Ətraflı",
    items: [
      { href: "/platformalar", label: "Platformalar", icon: Plug },
      { href: "/sekiller", label: "Şəkillər", icon: ImageIcon },
      { href: "/sablonlar", label: "Şablonlar", icon: LayoutTemplate },
      { href: "/teqvim", label: "Təqvim", icon: CalendarDays },
      { href: "/kampaniyalar", label: "Kampaniyalar", icon: Rocket },
      { href: "/komanda", label: "Komanda", icon: Users },
      { href: "/analitika", label: "Analitika", icon: BarChart3 },
    ],
  },
  {
    label: "",
    items: [{ href: "/ayarlar", label: "Ayarlar", icon: Settings }],
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
