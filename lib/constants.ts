// 360tools.az — paylaşılan konstantlar və Azərbaycan dilində etiketlər

export const PLATFORMS = {
  "tap-az": { label: "Tap.az", icon: "🏷️", group: "marketplace" },
  "instagram-post": { label: "Instagram Post", icon: "📸", group: "social" },
  "instagram-story": { label: "Instagram Story", icon: "📱", group: "social" },
  "instagram-reels": { label: "Instagram Reels", icon: "🎬", group: "social" },
  birmarket: { label: "Birmarket", icon: "🛒", group: "marketplace" },
  umico: { label: "Umico", icon: "🛍️", group: "marketplace" },
  website: { label: "Sayt (SEO)", icon: "🌐", group: "web" },
  whatsapp: { label: "WhatsApp Kataloq", icon: "💬", group: "messaging" },
  telegram: { label: "Telegram Post", icon: "✈️", group: "messaging" },
  "facebook-marketplace": { label: "Facebook Marketplace", icon: "👥", group: "marketplace" },
} as const;

export type PlatformKey = keyof typeof PLATFORMS;
export const PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[];

export const CONTENT_STATUSES = {
  qaralama: { label: "Qaralama", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  hazirdir: { label: "Hazırdır", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "tesdiq-gozleyir": { label: "Təsdiq gözləyir", color: "bg-amber-50 text-amber-700 border-amber-200" },
  yerlesdirildi: { label: "Yerləşdirildi", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  xeta: { label: "Xəta verdi", color: "bg-red-50 text-red-700 border-red-200" },
} as const;

export type ContentStatusKey = keyof typeof CONTENT_STATUSES;
export const CONTENT_STATUS_KEYS = Object.keys(CONTENT_STATUSES) as ContentStatusKey[];

export const PRODUCT_CATEGORIES = [
  "Elektronika",
  "Telefonlar",
  "Kompüter və noutbuklar",
  "Məişət texnikası",
  "Geyim və ayaqqabı",
  "Ev və bağ",
  "Gözəllik və sağlamlıq",
  "İdman və hobbi",
  "Uşaq məhsulları",
  "Avtomobil aksesuarları",
  "Mebel",
  "Digər",
] as const;

export const TEAM_ROLES = {
  owner: { label: "Sahibkar" },
  admin: { label: "Admin" },
  "content-manager": { label: "Kontent menecer" },
  designer: { label: "Dizayner" },
  "sales-manager": { label: "Satış meneceri" },
  moderator: { label: "Moderator" },
} as const;

export type TeamRoleKey = keyof typeof TEAM_ROLES;

export const TASK_STATUSES = {
  gozleyir: { label: "Gözləyir", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  icrada: { label: "İcrada", color: "bg-blue-50 text-blue-700 border-blue-200" },
  bitdi: { label: "Bitdi", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  gecikir: { label: "Gecikir", color: "bg-red-50 text-red-700 border-red-200" },
} as const;

export type TaskStatusKey = keyof typeof TASK_STATUSES;

export const TASK_PRIORITIES = {
  asagi: { label: "Aşağı", color: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  orta: { label: "Orta", color: "bg-amber-50 text-amber-700 border-amber-200" },
  yuksek: { label: "Yüksək", color: "bg-red-50 text-red-700 border-red-200" },
} as const;

export type TaskPriorityKey = keyof typeof TASK_PRIORITIES;

export const CALENDAR_ENTRY_TYPES = {
  post: { label: "Post", color: "bg-violet-50 text-violet-700 border-violet-200" },
  story: { label: "Story", color: "bg-pink-50 text-pink-700 border-pink-200" },
  kampaniya: { label: "Kampaniya", color: "bg-orange-50 text-orange-700 border-orange-200" },
  endirim: { label: "Endirim", color: "bg-red-50 text-red-700 border-red-200" },
  bayram: { label: "Bayram kontenti", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "yeni-mehsul": { label: "Yeni məhsul", color: "bg-blue-50 text-blue-700 border-blue-200" },
} as const;

export type CalendarEntryTypeKey = keyof typeof CALENDAR_ENTRY_TYPES;

export const CAMPAIGN_TYPES = {
  endirim: { label: "Endirim kampaniyası" },
  "yeni-mehsul": { label: "Yeni məhsul kampaniyası" },
  "2-al-1-ode": { label: "2 al 1 ödə" },
  "stok-bitir": { label: "Stok bitməzdən əvvəl" },
  bayram: { label: "Bayram kampaniyası" },
  region: { label: "Region kampaniyası" },
} as const;

export type CampaignTypeKey = keyof typeof CAMPAIGN_TYPES;

export const TEMPLATE_TYPES = {
  "instagram-post": { label: "Instagram post şablonu" },
  story: { label: "Story şablonu" },
  endirim: { label: "Endirim şablonu" },
  "yeni-mehsul": { label: "Yeni məhsul şablonu" },
  premium: { label: "Premium məhsul şablonu" },
  "marketplace-sekil": { label: "Marketplace şəkil şablonu" },
  "tap-az-metn": { label: "Tap.az elan mətni şablonu" },
  whatsapp: { label: "WhatsApp paylaşım şablonu" },
} as const;

export type TemplateTypeKey = keyof typeof TEMPLATE_TYPES;

export const LANGUAGES = {
  az: { label: "Azərbaycan dili" },
  ru: { label: "Rus dili" },
  en: { label: "İngilis dili" },
} as const;

export type LanguageKey = keyof typeof LANGUAGES;

export const IMAGE_FORMATS = {
  "1:1": { label: "Kvadrat (1:1)", width: 1080, height: 1080, usage: "Instagram post, marketplace" },
  "4:5": { label: "Portret (4:5)", width: 1080, height: 1350, usage: "Instagram post" },
  "9:16": { label: "Story / Reels (9:16)", width: 1080, height: 1920, usage: "Instagram story, Reels" },
  "16:9": { label: "Geniş (16:9)", width: 1920, height: 1080, usage: "Sayt, Facebook, YouTube" },
} as const;

export type ImageFormatKey = keyof typeof IMAGE_FORMATS;

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toLocaleString("az-AZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₼`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" });
}
