import { generateText } from "ai";
import type { Product, BrandKit } from "@/lib/db/schema";
import { PLATFORMS, type PlatformKey, type LanguageKey, formatPrice } from "@/lib/constants";

// AI Gateway açarı varsa real model, yoxdursa deterministik şablon generatoru işləyir.
export const AI_MODEL = "anthropic/claude-sonnet-4-6";

export function aiAvailable(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
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
  platform: PlatformKey;
  language?: LanguageKey;
  tone?: "standart" | "premium" | "genc";
  extraInstructions?: string;
}

function parseSpecs(product: Product): { name: string; value: string }[] {
  try {
    return product.specs ? JSON.parse(product.specs) : [];
  } catch {
    return [];
  }
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

// ---------- Deterministik fallback generator ----------

function fallbackGenerate(opts: GenerateOptions): GeneratedContent {
  const { product, brand, platform } = opts;
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
  }
}

// ---------- AI generator (Gateway mövcuddursa) ----------

const LANG_NAMES: Record<LanguageKey, string> = {
  az: "Azərbaycan dilində",
  ru: "rus dilində",
  en: "ingilis dilində",
};

async function aiGenerate(opts: GenerateOptions): Promise<GeneratedContent> {
  const { product, brand, platform } = opts;
  const lang = opts.language ?? "az";
  const specs = parseSpecs(product);

  const prompt = `Sən Azərbaycan bazarı üçün professional satış kontenti yazan köməkçisən.
Aşağıdakı məhsul üçün "${PLATFORMS[platform].label}" platformasına uyğun, ${LANG_NAMES[lang]} satış kontenti hazırla.

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
${opts.tone ? `- Ton: ${opts.tone}` : ""}
${opts.extraInstructions ? `- Əlavə təlimat: ${opts.extraInstructions}` : ""}

Vacib qaydalar:
- Məhsul haqqında yanlış iddia yazma, yalnız verilən məlumatdan istifadə et.
- Platformanın üslubuna uyğun yaz (marketplace üçün faktiki və səliqəli, Instagram üçün canlı və emojili).
- YALNIZ aşağıdakı JSON formatında cavab ver, başqa heç nə yazma:
{"title": "...", "body": "...", "hashtags": ["..."], "seoKeywords": ["..."]}`;

  const { text } = await generateText({ model: AI_MODEL, prompt });
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI cavabında JSON tapılmadı");
  const parsed = JSON.parse(jsonMatch[0]) as Partial<GeneratedContent>;
  if (!parsed.title || !parsed.body) throw new Error("AI cavabı natamamdır");
  return {
    title: parsed.title,
    body: parsed.body,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords : [],
  };
}

/**
 * Platforma üçün kontent yaradır. AI Gateway açarı varsa real AI istifadə olunur,
 * yoxdursa və ya AI xəta versə deterministik şablon generatoru işləyir.
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

export function qualityCheck(content: GeneratedContent, product: Product, platform: PlatformKey): QualityResult {
  const issues: string[] = [];
  let score = 100;

  if (content.title.trim().length < 15) {
    issues.push("Başlıq çox qısadır — daha təsvirli başlıq yazın");
    score -= 15;
  }
  if (content.title.trim().length > 90 && (platform === "tap-az" || platform === "birmarket" || platform === "umico")) {
    issues.push("Başlıq marketplace üçün çox uzundur");
    score -= 10;
  }
  if (content.body.trim().length < 60) {
    issues.push("Mətn çox qısadır — alıcı üçün kifayət qədər məlumat yoxdur");
    score -= 20;
  }
  if (content.body.trim().length > 2200 && platform.startsWith("instagram")) {
    issues.push("Mətn Instagram limiti (2200 simvol) üçün çox uzundur");
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
  if (platform.startsWith("instagram") && content.hashtags.length === 0 && platform !== "instagram-story") {
    issues.push("Hashtag əlavə olunmayıb");
    score -= 5;
  }
  const images = (() => {
    try {
      return product.images ? (JSON.parse(product.images) as string[]) : [];
    } catch {
      return [];
    }
  })();
  if (images.length === 0) {
    issues.push("Məhsulun şəkli yüklənməyib");
    score -= 10;
  }

  return { score: Math.max(0, score), issues };
}
