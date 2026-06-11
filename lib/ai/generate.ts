import { generateText, type LanguageModel } from "ai";
import { createXai } from "@ai-sdk/xai";
import type { Product, BrandKit, Platform } from "@/lib/db/schema";
import {
  PLATFORMS,
  type PlatformKey,
  type LanguageKey,
  type StructureBlockKey,
  DEFAULT_STRUCTURE,
  formatPrice,
} from "@/lib/constants";

// AI açarı varsa real model, yoxdursa deterministik şablon generatoru işləyir.
// Üstünlük: xAI (Grok) → Vercel AI Gateway (Claude).
export const AI_MODEL = "anthropic/claude-sonnet-4-6";
const XAI_MODEL = process.env.XAI_MODEL || "grok-3";

export function aiAvailable(): boolean {
  return Boolean(
    process.env.XAI_API_KEY ||
      process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN
  );
}

/** Mövcud açara görə düzgün AI modelini qaytarır (Grok və ya Gateway). */
export function getAiModel(): LanguageModel {
  if (process.env.XAI_API_KEY) {
    const xai = createXai({ apiKey: process.env.XAI_API_KEY });
    return xai(XAI_MODEL);
  }
  // Gateway: "provider/model" sətri AI_GATEWAY_API_KEY ilə işləyir
  return AI_MODEL;
}

export interface GeneratedContent {
  title: string;
  body: string;
  hashtags: string[];
  seoKeywords: string[];
}

export interface GenerateOptions {
  product: Product;
  brand?: BrandKit | null;
  /** Platforma açarı — built-in və ya istifadəçinin yaratdığı custom platforma. */
  platform: string;
  /** Platforma profili (DB-dən) — qaydalar, nümunələr, limitlər buradan tətbiq olunur. */
  profile?: Platform | null;
  language?: LanguageKey;
  tone?: "standart" | "premium" | "genc" | "resmi";
  extraInstructions?: string;
}

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function parseSpecs(product: Product): { name: string; value: string }[] {
  return safeParse(product.specs, []);
}

function platformLabel(opts: GenerateOptions): string {
  return (
    opts.profile?.label ??
    (PLATFORMS as Record<string, { label: string }>)[opts.platform]?.label ??
    opts.platform
  );
}

function slugWords(product: Product): string[] {
  const words = [product.brand, product.model, product.category, "baku", "azerbaycan"]
    .filter(Boolean)
    .map((w) => String(w).toLowerCase().replace(/[^a-z0-9üöğıəçş]/gi, ""));
  return Array.from(new Set(words)).filter((w) => w.length > 1);
}

function priceLine(product: Product, lang: LanguageKey): string {
  const labels = { az: "Qiymət", ru: "Цена", en: "Price" } as const;
  const oldLabels = { az: "Köhnə qiymət", ru: "Старая цена", en: "Old price" } as const;
  if (product.salePrice && product.price && product.salePrice < product.price) {
    return `${oldLabels[lang]}: ${formatPrice(product.price)} → ${labels[lang]}: ${formatPrice(product.salePrice)} 🔥`;
  }
  return `${labels[lang]}: ${formatPrice(product.salePrice ?? product.price)}`;
}

// ---------- Profil tətbiqi ----------

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2190}-\u{21FF}\u{2B05}-\u{2B07}]/gu;

function stripEmojis(s: string): string {
  return s
    .replace(EMOJI_RE, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +\n/g, "\n")
    .trim();
}

/** Profil limitlərini hazır kontentə tətbiq edir (AI və fallback nəticələrinin hər ikisinə). */
function applyProfile(c: GeneratedContent, profile: Platform): GeneratedContent {
  let title = c.title;
  let body = c.body;
  let hashtags = [...c.hashtags];

  if (profile.emojiLevel === "none") {
    title = stripEmojis(title);
    body = stripEmojis(body);
  }
  if (profile.titleMaxLen > 0 && title.length > profile.titleMaxLen) {
    title = title.slice(0, Math.max(1, profile.titleMaxLen - 1)).trimEnd() + "…";
  }
  if (profile.hashtagMax >= 0 && hashtags.length > profile.hashtagMax) {
    hashtags = hashtags.slice(0, profile.hashtagMax);
  }
  if (profile.bodyMaxLen > 0 && body.length > profile.bodyMaxLen) {
    body = body.slice(0, profile.bodyMaxLen).trimEnd();
  }
  return { ...c, title, body, hashtags };
}

// ---------- Deterministik fallback generator ----------

function fallbackGenerate(opts: GenerateOptions): GeneratedContent {
  const base = builtinFallback(opts) ?? genericFallback(opts);
  return opts.profile ? applyProfile(base, opts.profile) : base;
}

/** Custom platformalar üçün profil strukturu əsasında generic qurucu. */
function genericFallback(opts: GenerateOptions): GeneratedContent {
  const { product, brand, profile } = opts;
  const lang: LanguageKey = opts.language ?? (profile?.defaultLanguage as LanguageKey) ?? "az";
  const specs = parseSpecs(product);
  const emoji = profile?.emojiLevel ?? "light";
  const structure = safeParse<StructureBlockKey[]>(profile?.structure, DEFAULT_STRUCTURE);
  const warranty = product.warranty ?? brand?.warrantyPolicy ?? "";
  const delivery = product.delivery ?? brand?.deliveryPolicy ?? "";
  const preferred = safeParse<string[]>(profile?.preferredPhrases, []);
  const cta =
    profile?.ctaText ??
    profile?.contactFormat ??
    (brand?.phone ? `Sifariş üçün əlaqə: ${brand.phone}` : "Sifariş üçün bizimlə əlaqə saxlayın.");

  const blocks: Record<StructureBlockKey, string> = {
    opener:
      emoji === "rich"
        ? `${product.name} artıq bizdə! ✨`
        : `${product.name}${product.color ? `, ${product.color}` : ""} — yeni təklif.`,
    specs: specs.length ? specs.map((s) => `• ${s.name}: ${s.value}`).join("\n") : "",
    price: priceLine(product, lang),
    warranty: warranty ? (emoji === "none" ? `Zəmanət: ${warranty}` : `🛡 ${warranty}`) : "",
    delivery: delivery ? (emoji === "none" ? `Çatdırılma: ${delivery}` : `🚚 ${delivery}`) : "",
    cta,
  };

  const body = [
    ...structure.map((k) => blocks[k] ?? ""),
    ...(preferred.length ? [preferred[0]] : []),
  ]
    .filter(Boolean)
    .join("\n\n");

  const hashtags = (profile?.hashtagMax ?? 10) > 0 ? slugWords(product) : [];
  const seoKeywords = [
    product.name.toLowerCase(),
    [product.brand, product.model].filter(Boolean).join(" ").toLowerCase(),
    `${product.category.toLowerCase()} baku`,
  ].filter((k) => k.trim().length > 2);

  return { title: product.name, body, hashtags, seoKeywords };
}

/** Built-in platformalar üçün əl ilə hazırlanmış şablonlar; custom açarlar üçün null. */
function builtinFallback(opts: GenerateOptions): GeneratedContent | null {
  const { product, brand } = opts;
  const platform = opts.platform as PlatformKey;
  const lang: LanguageKey = opts.language ?? "az";
  const specs = parseSpecs(product);
  const specLines = specs.map((s) => `• ${s.name}: ${s.value}`).join("\n");
  const warranty = product.warranty ?? brand?.warrantyPolicy ?? "";
  const delivery = product.delivery ?? brand?.deliveryPolicy ?? "";
  const contact =
    brand?.whatsapp || brand?.phone
      ? lang === "ru"
        ? `Для заказа напишите в WhatsApp: ${brand?.phone ?? ""}`
        : lang === "en"
          ? `To order, message us on WhatsApp: ${brand?.phone ?? ""}`
          : `Sifariş üçün WhatsApp-a yazın: ${brand?.phone ?? ""}`
      : lang === "ru"
        ? "Свяжитесь с нами для заказа"
        : lang === "en"
          ? "Contact us to order"
          : "Sifariş üçün bizimlə əlaqə saxlayın";

  const hashtags = slugWords(product).map((w) => w.replace(/\s+/g, ""));
  const seoKeywords = [
    product.name.toLowerCase(),
    [product.brand, product.model].filter(Boolean).join(" ").toLowerCase(),
    `${product.category.toLowerCase()} baku`,
  ].filter((k) => k.trim().length > 2);

  const discount =
    product.salePrice && product.price && product.salePrice < product.price
      ? Math.round((1 - product.salePrice / product.price) * 100)
      : 0;

  switch (platform) {
    case "tap-az": {
      const title =
        discount > 0
          ? `${product.name} — ${discount}% endirimlə, ${warranty ? "zəmanətlə" : "sərfəli qiymətə"}!`
          : `${product.name} — ${warranty ? "rəsmi zəmanətlə" : "sərfəli qiymətə"}`;
      const body = [
        `${product.name}${product.color ? `, ${product.color} rəngdə` : ""}.`,
        specLines && `\nTexniki göstəricilər:\n${specLines}`,
        warranty && `\n✅ ${warranty}`,
        delivery && `✅ ${delivery}`,
        `\n${priceLine(product, lang)}`,
        `\n${contact}`,
      ]
        .filter(Boolean)
        .join("\n");
      return { title, body, hashtags, seoKeywords };
    }
    case "instagram-post": {
      const tone = opts.tone ?? "standart";
      const opener =
        tone === "premium"
          ? `${product.name} — seçilmişlər üçün. ✨`
          : tone === "genc"
            ? `Bunu görməsən olmaz! 😍 ${product.name} artıq bizdə! 🔥`
            : `${product.name} artıq stokda! ✨`;
      const body = [
        opener,
        "",
        specLines,
        "",
        `💰 ${priceLine(product, lang)}`,
        warranty ? `🛡 ${warranty}` : null,
        delivery ? `🚚 ${delivery}` : null,
        product.stock != null && product.stock <= 5 ? `⏳ Stokda cəmi ${product.stock} ədəd qalıb!` : null,
        "",
        "Sifariş üçün DM və ya WhatsApp! 📲",
      ]
        .filter((l): l is string => l !== null)
        .join("\n")
        .replace(/\n{3,}/g, "\n\n");
      return { title: opener, body, hashtags: [...hashtags, "instagram", "alisveris"], seoKeywords };
    }
    case "instagram-story": {
      const body = [
        `⚡ ${product.name}`,
        priceLine(product, lang),
        discount > 0 ? `${discount}% ENDİRİM 🔥` : "",
        "",
        "Yuxarı sürüşdür və sifariş et! ⬆️",
      ]
        .filter(Boolean)
        .join("\n");
      return { title: `${product.name} — story`, body, hashtags, seoKeywords };
    }
    case "instagram-reels": {
      const body = [
        `${product.name} yaxından tanı! 🎬`,
        "",
        specs.slice(0, 3).map((s) => `✅ ${s.name}: ${s.value}`).join("\n"),
        "",
        `💰 ${priceLine(product, lang)}`,
        "Ətraflı üçün profilə keç! 📲",
      ]
        .filter(Boolean)
        .join("\n");
      return { title: `${product.name} — Reels`, body, hashtags: [...hashtags, "reels", "kesfet"], seoKeywords };
    }
    case "birmarket":
    case "umico": {
      const marketplaceName = [product.brand, product.model, product.color, product.size]
        .filter(Boolean)
        .join(" ");
      const body = [
        `${product.name}. `,
        specs.length ? `${specs.map((s) => `${s.name}: ${s.value}`).join(". ")}. ` : "",
        warranty ? `${warranty}. ` : "",
        delivery ? `${delivery}.` : "",
      ]
        .join("")
        .trim();
      return {
        title: marketplaceName || product.name,
        body,
        hashtags: [],
        seoKeywords,
      };
    }
    case "website": {
      const businessName = brand?.businessName ?? "";
      const title = `${product.name}${businessName ? ` — ${businessName}` : ""}`;
      const body = [
        `${product.name}${product.color ? `, ${product.color} rəngdə` : ""}. `,
        specs.length ? `Əsas xüsusiyyətlər: ${specs.map((s) => `${s.name} — ${s.value}`).join("; ")}. ` : "",
        warranty ? `${warranty}. ` : "",
        `${businessName || "Mağazamızdan"} sərfəli qiymətə sifariş edin.`,
      ].join("");
      return { title, body, hashtags: [], seoKeywords };
    }
    case "whatsapp": {
      const body = [
        "Salam! 👋",
        "",
        `*${product.name}*`,
        priceLine(product, lang),
        warranty ? `🛡 ${warranty}` : null,
        delivery ? `🚚 ${delivery}` : null,
        "",
        "Sifariş etmək istəyirsinizsə, bu mesaja cavab yazın.",
      ]
        .filter((l): l is string => l !== null)
        .join("\n");
      return { title: product.name, body, hashtags: [], seoKeywords };
    }
    case "telegram": {
      const body = [
        `📦 ${product.name}`,
        "",
        specLines,
        "",
        `💰 ${priceLine(product, lang)}`,
        warranty ? `🛡 ${warranty}` : null,
        contact,
      ]
        .filter((l): l is string => l !== null)
        .join("\n");
      return { title: product.name, body, hashtags, seoKeywords };
    }
    case "facebook-marketplace": {
      const body = [
        `${product.name}${product.color ? ` (${product.color})` : ""}`,
        "",
        specLines,
        "",
        priceLine(product, lang),
        warranty ? `Zəmanət: ${warranty}` : null,
        delivery ? `Çatdırılma: ${delivery}` : null,
      ]
        .filter((l): l is string => l !== null)
        .join("\n");
      return { title: product.name, body, hashtags, seoKeywords };
    }
    default:
      return null;
  }
}

// ---------- AI generator (Gateway mövcuddursa) ----------

const LANG_NAMES: Record<LanguageKey, string> = {
  az: "Azərbaycan dilində",
  ru: "rus dilində",
  en: "ingilis dilində",
};

const EMOJI_INSTRUCTIONS = {
  none: "Emoji istifadə ETMƏ.",
  light: "Az miqdarda, yerində emoji istifadə et.",
  rich: "Canlı, bol emojili üslub istifadə et.",
} as const;

function buildProfileRules(profile: Platform): string {
  const forbidden = safeParse<string[]>(profile.forbiddenWords, []);
  const preferred = safeParse<string[]>(profile.preferredPhrases, []);
  const lines = [
    `- Başlıq maksimum ${profile.titleMaxLen} simvol olsun`,
    `- Mətn ${profile.bodyMinLen}–${profile.bodyMaxLen} simvol aralığında olsun`,
    profile.hashtagMax === 0
      ? "- Hashtag YAZMA"
      : `- Hashtag sayı ${profile.hashtagMin}–${profile.hashtagMax} olsun`,
    `- ${EMOJI_INSTRUCTIONS[(profile.emojiLevel as keyof typeof EMOJI_INSTRUCTIONS)] ?? EMOJI_INSTRUCTIONS.light}`,
    `- Ton: ${profile.toneDefault}`,
    profile.ctaText ? `- Çağırış (CTA) mətni: "${profile.ctaText}"` : null,
    profile.contactFormat ? `- Əlaqə formatı: ${profile.contactFormat}` : null,
    forbidden.length ? `- Bu sözləri İŞLƏTMƏ: ${forbidden.join(", ")}` : null,
    preferred.length ? `- Bu ifadələrə üstünlük ver: ${preferred.join(", ")}` : null,
    profile.extraInstructions ? `- Əlavə qayda: ${profile.extraInstructions}` : null,
  ].filter((l): l is string => l !== null);
  return `\nPlatforma qaydaları (MÜTLƏQ riayət et):\n${lines.join("\n")}`;
}

function buildExamplesBlock(profile: Platform): string {
  const examples = safeParse<string[]>(profile.examples, []).filter((e) => e.trim().length > 0);
  if (!examples.length) return "";
  return `\nBu platformada bəyənilən nümunə postlar (ÜSLUBUNU təqlid et, məzmununu KÖÇÜRMƏ):\n${examples
    .map((e, i) => `--- Nümunə ${i + 1} ---\n${e.trim()}`)
    .join("\n")}\n--- Nümunələrin sonu ---`;
}

async function aiGenerate(opts: GenerateOptions): Promise<GeneratedContent> {
  const { product, brand, profile } = opts;
  const lang: LanguageKey = opts.language ?? (profile?.defaultLanguage as LanguageKey) ?? "az";
  const specs = parseSpecs(product);
  const tone = opts.tone ?? profile?.toneDefault;

  const prompt = `Sən Azərbaycan bazarı üçün professional satış kontenti yazan köməkçisən.
Aşağıdakı məhsul üçün "${platformLabel(opts)}" platformasına uyğun, ${LANG_NAMES[lang]} satış kontenti hazırla.

Məhsul:
- Ad: ${product.name}
- Marka/Model: ${product.brand ?? "-"} ${product.model ?? ""}
- Kateqoriya: ${product.category}
- Qiymət: ${formatPrice(product.price)}${product.salePrice ? ` (endirimli: ${formatPrice(product.salePrice)})` : ""}
- Rəng: ${product.color ?? "-"}
- Zəmanət: ${product.warranty ?? brand?.warrantyPolicy ?? "-"}
- Çatdırılma: ${product.delivery ?? brand?.deliveryPolicy ?? "-"}
- Texniki göstəricilər: ${specs.map((s) => `${s.name}: ${s.value}`).join("; ") || "-"}
${brand?.businessName ? `- Mağaza: ${brand.businessName} (${brand.slogan ?? ""})` : ""}
${tone ? `- Ton: ${tone}` : ""}
${opts.extraInstructions ? `- Əlavə təlimat: ${opts.extraInstructions}` : ""}
${profile ? buildProfileRules(profile) : ""}
${profile ? buildExamplesBlock(profile) : ""}

Vacib qaydalar:
- Məhsul haqqında yanlış iddia yazma, yalnız verilən məlumatdan istifadə et.
- Platformanın üslubuna uyğun yaz (marketplace üçün faktiki və səliqəli, sosial media üçün canlı).
- YALNIZ aşağıdakı JSON formatında cavab ver, başqa heç nə yazma:
{"title": "...", "body": "...", "hashtags": ["..."], "seoKeywords": ["..."]}`;

  const { text } = await generateText({ model: getAiModel(), prompt });
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI cavabında JSON tapılmadı");
  const parsed = JSON.parse(jsonMatch[0]) as Partial<GeneratedContent>;
  if (!parsed.title || !parsed.body) throw new Error("AI cavabı natamamdır");
  const result: GeneratedContent = {
    title: parsed.title,
    body: parsed.body,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords : [],
  };
  // AI nəticəsinə də sərt limitlər tətbiq olunur — qaydalar zəmanətli işləsin
  return profile ? applyProfile(result, profile) : result;
}

/**
 * Platforma üçün kontent yaradır. AI Gateway açarı varsa real AI istifadə olunur,
 * yoxdursa və ya AI xəta versə deterministik şablon generatoru işləyir.
 * Profil verildikdə qaydalar (limitlər, emoji, CTA, nümunələr) hər iki yolda tətbiq olunur.
 */
export async function generatePlatformContent(opts: GenerateOptions): Promise<GeneratedContent> {
  if (aiAvailable()) {
    try {
      return await aiGenerate(opts);
    } catch (err) {
      console.error("AI generasiya xətası, fallback istifadə olunur:", err);
    }
  }
  return fallbackGenerate(opts);
}

// ---------- Keyfiyyət yoxlaması ----------

export interface QualityResult {
  score: number; // 0-100
  issues: string[];
}

export function qualityCheck(
  content: GeneratedContent,
  product: Product,
  platform: string,
  profile?: Platform | null
): QualityResult {
  const issues: string[] = [];
  let score = 100;

  const isMarketplace = platform === "tap-az" || platform === "birmarket" || platform === "umico";
  const titleMax = profile?.titleMaxLen ?? (isMarketplace ? 90 : 120);
  const bodyMin = profile?.bodyMinLen ?? 60;
  const bodyMax = profile?.bodyMaxLen ?? (platform.startsWith("instagram") ? 2200 : 5000);
  const hashtagMin =
    profile?.hashtagMin ?? (platform.startsWith("instagram") && platform !== "instagram-story" ? 1 : 0);

  if (content.title.trim().length < 15) {
    issues.push("Başlıq çox qısadır — daha təsvirli başlıq yazın");
    score -= 15;
  }
  if (content.title.trim().length > titleMax) {
    issues.push(`Başlıq limit aşır (maksimum ${titleMax} simvol)`);
    score -= 10;
  }
  if (content.body.trim().length < bodyMin) {
    issues.push("Mətn çox qısadır — alıcı üçün kifayət qədər məlumat yoxdur");
    score -= 20;
  }
  if (content.body.trim().length > bodyMax) {
    issues.push(`Mətn platforma limiti (${bodyMax} simvol) üçün çox uzundur`);
    score -= 15;
  }
  if (product.price == null && product.salePrice == null) {
    issues.push("Qiymət əlavə olunmayıb");
    score -= 15;
  }
  if (!product.warranty && !content.body.toLowerCase().includes("zəmanət")) {
    issues.push("Zəmanət məlumatı qeyd olunmayıb");
    score -= 5;
  }
  if (hashtagMin > 0 && content.hashtags.length < hashtagMin) {
    issues.push("Hashtag əlavə olunmayıb");
    score -= 5;
  }

  // Profilin qadağan etdiyi sözlər
  const forbidden = safeParse<string[]>(profile?.forbiddenWords, []);
  if (forbidden.length) {
    const haystack = `${content.title} ${content.body}`.toLowerCase();
    const found = forbidden.filter((w) => w.trim() && haystack.includes(w.trim().toLowerCase()));
    if (found.length) {
      issues.push(`Qadağan olunmuş söz işlənib: ${found.join(", ")}`);
      score -= Math.min(20, found.length * 10);
    }
  }

  const images = safeParse<string[]>(product.images, []);
  if (images.length === 0) {
    issues.push("Məhsulun şəkli yüklənməyib");
    score -= 10;
  }

  return { score: Math.max(0, score), issues };
}
