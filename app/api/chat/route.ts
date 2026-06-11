import { NextResponse } from "next/server";
import { generateText, type ModelMessage } from "ai";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, brandKit, type Product, type BrandKit } from "@/lib/db/schema";
import { aiAvailable, generatePlatformContent, AI_MODEL } from "@/lib/ai/generate";
import { PLATFORMS, formatPrice, type PlatformKey, type LanguageKey } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ə/g, "e")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ç/g, "c")
    .replace(/ş/g, "s");
}

// İstifadəçi mesajında məhsulu axtar: ad/marka/model sözlərinin uyğunluğuna görə bal ver
function findProduct(message: string, rows: Product[]): Product | null {
  const msg = normalize(message);
  let best: Product | null = null;
  let bestScore = 0;
  for (const p of rows) {
    const tokens = [p.name, p.brand ?? "", p.model ?? ""]
      .join(" ")
      .split(/[\s,\-—/]+/)
      .map((t) => normalize(t))
      .filter((t) => t.length >= 2);
    const unique = Array.from(new Set(tokens));
    let score = 0;
    for (const t of unique) {
      if (msg.includes(t)) score += t.length >= 4 ? 2 : 1;
    }
    if (normalize(p.name) && msg.includes(normalize(p.name))) score += 5;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 2 ? best : null;
}

function detectPlatform(message: string): PlatformKey {
  const msg = normalize(message);
  if (msg.includes("story")) return "instagram-story";
  if (msg.includes("reels") || msg.includes("video")) return "instagram-reels";
  if (msg.includes("tap.az") || msg.includes("tap az") || /\btap\b/.test(msg)) return "tap-az";
  if (msg.includes("umico")) return "umico";
  if (msg.includes("birmarket")) return "birmarket";
  if (msg.includes("whatsapp") || msg.includes("vatsap")) return "whatsapp";
  if (msg.includes("telegram") || msg.includes("teleqram")) return "telegram";
  if (msg.includes("facebook") || msg.includes("feysbuk")) return "facebook-marketplace";
  if (msg.includes("sayt") || msg.includes("seo") || msg.includes("website")) return "website";
  return "instagram-post";
}

function detectLanguage(message: string): LanguageKey {
  const msg = normalize(message);
  if (msg.includes("rus") || message.toLowerCase().includes("русск") || msg.includes("po-russki")) return "ru";
  if (msg.includes("ingilis") || msg.includes("english")) return "en";
  return "az";
}

function detectTone(message: string): "standart" | "premium" | "genc" {
  const msg = normalize(message);
  if (msg.includes("premium") || msg.includes("luks") || msg.includes("lüks")) return "premium";
  if (msg.includes("genc") || msg.includes("dinamik") || msg.includes("emoji")) return "genc";
  return "standart";
}

function productListText(rows: Product[]): string {
  return rows
    .slice(0, 10)
    .map((p) => `• ${p.name} (${formatPrice(p.salePrice ?? p.price)})`)
    .join("\n");
}

// Qayda-əsaslı fallback cavab (AI açarı olmadıqda və ya AI xəta verdikdə)
async function fallbackReply(messages: ChatMessage[], rows: Product[], brand: BrandKit | null): Promise<string> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const message = lastUser?.content ?? "";
  const product = findProduct(message, rows);

  if (!product) {
    return [
      "Salam! Mən 360tools.az AI assistentiyəm — satış kontenti hazırlamaqda kömək edirəm. 👋",
      "",
      "Bunları edə bilərəm:",
      "• Tap.az, Instagram, Umico, Birmarket və digər platformalar üçün elan mətni",
      "• Daha satıcı başlıq variantları və hashtag dəstləri",
      "• Azərbaycan, rus və ingilis dillərində kontent",
      "",
      "Kataloqdakı məhsullardan birini qeyd edin:",
      productListText(rows),
      "",
      "Məsələn yazın: «iPhone 16 Pro üçün premium Instagram postu hazırla».",
    ].join("\n");
  }

  const platform = detectPlatform(message);
  const language = detectLanguage(message);
  const tone = detectTone(message);
  const generated = await generatePlatformContent({ product, brand, platform, language, tone });
  const msg = normalize(message);

  // Hashtag istəyi: əsas diqqəti hashtag dəstlərinə ver
  if (msg.includes("hashtag") || msg.includes("hesteq") || msg.includes("#")) {
    const base = generated.hashtags.map((h) => `#${h.replace(/^#/, "")}`);
    const extra = ["#endirim", "#alisveris", "#baku", "#azerbaycan", "#onlinesatis"];
    const all = Array.from(new Set([...base, ...extra]));
    const sets: string[] = [];
    for (let i = 0; i < Math.min(5, Math.ceil(all.length / 3)); i++) {
      const chunk = all.slice(i * 3, i * 3 + 3);
      if (chunk.length) sets.push(`${i + 1}) ${chunk.join(" ")}`);
    }
    return [
      `«${product.name}» üçün hashtag dəstləri:`,
      "",
      sets.join("\n"),
      "",
      `Tam dəst: ${all.join(" ")}`,
    ].join("\n");
  }

  // Başlıq variantları istəyi
  if (msg.includes("baslig") || msg.includes("basliq") || msg.includes("variant")) {
    const price = formatPrice(product.salePrice ?? product.price);
    const variants = [
      generated.title,
      `${product.name} — ${price}, ${product.warranty ? "rəsmi zəmanətlə" : "sərfəli qiymətə"}!`,
      `Axtardığınız ${product.name} artıq stokda — fürsəti qaçırmayın!`,
      `${product.name}: keyfiyyət və qiymət bir arada (${price})`,
    ];
    return [
      `«${product.name}» üçün başlıq variantları (${PLATFORMS[platform].label}):`,
      "",
      variants.map((v, i) => `${i + 1}) ${v}`).join("\n"),
    ].join("\n");
  }

  const lines = [
    `${PLATFORMS[platform].icon} ${PLATFORMS[platform].label} üçün hazırladığım kontent — ${product.name}:`,
    "",
    `📌 Başlıq: ${generated.title}`,
    "",
    generated.body,
  ];
  if (generated.hashtags.length) {
    lines.push("", `🏷 Hashtaglar: ${generated.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`);
  }
  lines.push("", "İstəsəniz başqa platforma, dil və ya ton üçün də hazırlaya bilərəm.");
  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { messages?: unknown } | null;
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const messages: ChatMessage[] = rawMessages
      .filter(
        (m): m is ChatMessage =>
          !!m &&
          typeof m === "object" &&
          ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
          typeof (m as ChatMessage).content === "string" &&
          (m as ChatMessage).content.trim().length > 0
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
      .slice(-20);

    if (messages.length === 0) {
      return NextResponse.json({
        reply: "Salam! Hansı məhsul üçün kontent hazırlamağımı istəyirsiniz?",
      });
    }

    const productRows = db.select().from(products).where(eq(products.status, "aktiv")).all();
    const brand = db.select().from(brandKit).limit(1).get() ?? null;

    if (aiAvailable()) {
      try {
        const system = [
          "Sən 360tools.az platformasının Azərbaycan dilində satış kontenti üzrə AI assistentisən.",
          "Bizneslərə Tap.az, Instagram (post/story/reels), Umico, Birmarket, WhatsApp, Telegram, Facebook Marketplace və sayt (SEO) üçün satış kontenti hazırlamaqda kömək edirsən.",
          brand?.businessName
            ? `Mağaza: ${brand.businessName}${brand.slogan ? ` — ${brand.slogan}` : ""}. Əlaqə: ${brand.phone ?? "-"}${brand.instagram ? `, Instagram: ${brand.instagram}` : ""}.`
            : "",
          brand?.deliveryPolicy ? `Çatdırılma siyasəti: ${brand.deliveryPolicy}` : "",
          brand?.warrantyPolicy ? `Zəmanət siyasəti: ${brand.warrantyPolicy}` : "",
          "Mövcud məhsullar:",
          productRows
            .map(
              (p) =>
                `- ${p.name} | ${[p.brand, p.model].filter(Boolean).join(" ") || "-"} | ${p.category} | ${formatPrice(p.salePrice ?? p.price)}${p.warranty ? ` | ${p.warranty}` : ""}`
            )
            .join("\n"),
          "",
          "Qaydalar: standart cavab dili Azərbaycan dilidir (istifadəçi başqa dil istəsə, o dildə yaz).",
          "Məhsul haqqında yanlış iddia yazma — yalnız verilən məlumatdan istifadə et.",
          "Cavabları səliqəli, kopyalanmağa hazır formatda ver. Platformanın üslubuna uyğun yaz.",
        ]
          .filter(Boolean)
          .join("\n");

        const modelMessages: ModelMessage[] = messages.map((m) =>
          m.role === "user"
            ? { role: "user", content: m.content }
            : { role: "assistant", content: m.content }
        );

        const { text } = await generateText({ model: AI_MODEL, system, messages: modelMessages });
        if (text.trim()) {
          return NextResponse.json({ reply: text });
        }
      } catch (err) {
        console.error("AI çat xətası, fallback istifadə olunur:", err);
      }
    }

    const reply = await fallbackReply(messages, productRows, brand);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Çat API xətası:", err);
    return NextResponse.json({
      reply: "Üzr istəyirəm, cavab hazırlanarkən gözlənilməz xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.",
    });
  }
}
