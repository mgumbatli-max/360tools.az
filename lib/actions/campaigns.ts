"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { db } from "@/lib/db";
import { campaigns, type Campaign } from "@/lib/db/schema";
import { CAMPAIGN_TYPES, formatDate, type CampaignTypeKey } from "@/lib/constants";
import { aiAvailable, getAiModel } from "@/lib/ai/generate";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface CreateCampaignInput {
  name: string;
  type: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

const CAMPAIGN_STATUS_KEYS = ["qaralama", "aktiv", "bitdi"] as const;
export type CampaignStatusKey = (typeof CAMPAIGN_STATUS_KEYS)[number];

export async function createCampaign(input: CreateCampaignInput): Promise<ActionResult> {
  const name = input.name?.trim();
  if (!name) {
    return { ok: false, error: "Kampaniya adı boş ola bilməz" };
  }
  if (!(input.type in CAMPAIGN_TYPES)) {
    return { ok: false, error: "Kampaniya tipi düzgün seçilməyib" };
  }
  const startDate = input.startDate?.trim() || null;
  const endDate = input.endDate?.trim() || null;
  if (startDate && endDate && endDate < startDate) {
    return { ok: false, error: "Bitmə tarixi başlama tarixindən əvvəl ola bilməz" };
  }

  db.insert(campaigns)
    .values({
      name,
      type: input.type,
      description: input.description?.trim() || null,
      startDate,
      endDate,
      status: "qaralama",
      ideas: null,
      createdAt: new Date().toISOString(),
    })
    .run();

  revalidatePath("/kampaniyalar");
  return { ok: true };
}

export async function updateCampaignStatus(id: number, status: string): Promise<ActionResult> {
  if (!CAMPAIGN_STATUS_KEYS.includes(status as CampaignStatusKey)) {
    return { ok: false, error: "Status düzgün deyil" };
  }
  const campaign = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
  if (!campaign) {
    return { ok: false, error: "Kampaniya tapılmadı" };
  }
  db.update(campaigns).set({ status }).where(eq(campaigns.id, id)).run();

  revalidatePath("/kampaniyalar");
  return { ok: true };
}

export async function deleteCampaign(id: number): Promise<ActionResult> {
  const campaign = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
  if (!campaign) {
    return { ok: false, error: "Kampaniya tapılmadı" };
  }
  db.delete(campaigns).where(eq(campaigns.id, id)).run();

  revalidatePath("/kampaniyalar");
  return { ok: true };
}

// ---------- AI ideya generasiyası ----------

const FALLBACK_IDEAS: Record<CampaignTypeKey, string[]> = {
  endirim: [
    "Instagram karusel: \"Əvvəl/Sonra\" qiymət müqayisəsi — köhnə qiymət üstündən xətt, yeni qiymət böyük şriftlə.",
    "Instagram story geri sayım stikeri: \"Endirimə son 24 saat\" — hər gün yenilənən story seriyası.",
    "Tap.az elan başlıqlarını yenilə: başlığın əvvəlinə endirim faizini əlavə et (məs. \"–30% ENDİRİM\").",
    "WhatsApp broadcast: daimi müştərilərə fərdi endirim təklifi ilə qısa mesaj göndər.",
    "Reels: 15 saniyəlik \"qiymət düşür\" videosu — məhsul göstərilir, qiymət animasiya ilə azalır.",
  ],
  "yeni-mehsul": [
    "Teaser story seriyası: məhsulun siluetini göstər, \"Sabah açıqlanır\" yazısı ilə maraq yarat.",
    "Instagram karusel postu: yeni məhsulun 5 əsas xüsusiyyəti — hər slaydda bir üstünlük.",
    "Unboxing Reels: qutudan çıxarma anı, ilk təəssürat və sonda qiymət.",
    "İlk 10 alıcıya kiçik hədiyyə — postda və story-də elan et, təcililik yarat.",
    "Tap.az və Umico-da \"YENİ\" vurğulu elan yerləşdir, ilk həftə üçün tanışlıq qiyməti göstər.",
  ],
  "2-al-1-ode": [
    "Instagram karusel: sərfəli kombinasiya nümunələri — hansı 2 məhsulu birlikdə almaq daha çox qənaət edir.",
    "Story sorğusu: \"Hansı kombinasiyanı seçərdin?\" — interaktiv stiker ilə izləyiciləri aktivləşdir.",
    "WhatsApp kataloqda \"2 al 1 ödə\" bölməsi yarat və broadcast mesajı ilə paylaş.",
    "Qənaət postu: müştərinin konkret neçə manat qənaət etdiyini hesabla və böyük rəqəmlə göstər.",
    "Profil bio və örtük şəkillərində kampaniya banneri — bitmə tarixini mütləq qeyd et.",
  ],
  "stok-bitir": [
    "Story: \"Stokda son X ədəd\" — real qalıq rəqəmi ilə təcililik yarat, hər gün yenilə.",
    "Instagram post: \"Bitməzdən əvvəl son şans\" — qalan məhsulların siyahısı qiymətlərlə birlikdə.",
    "Tap.az elanlarını yenilə: başlığa \"SON ƏDƏDLƏR\" əlavə et və elanı önə çıxart.",
    "WhatsApp broadcast: əvvəllər maraqlanan müştərilərə \"gözlədiyiniz məhsul bitmək üzrədir\" mesajı.",
    "Bonus pilləsi: stok azaldıqca pulsuz çatdırılma və ya kiçik hədiyyə təklif et.",
  ],
  bayram: [
    "Bayram hədiyyə bələdçisi: \"Kimə nə alaq?\" karusel postu — büdcə kateqoriyaları üzrə təkliflər.",
    "Bayrama xüsusi hədiyyə qablaşdırması — story-də nümunəni göstər, sifarişlərdə pulsuz təklif et.",
    "Geri sayım story seriyası: bayrama qalan günlər + hər gün bir xüsusi təklif.",
    "Səmimi bayram təbriki postu brend rənglərində — satışsız, etibar və yaxınlıq yaradır.",
    "Son çatdırılma elanı: \"Bayrama çatdırılma üçün son sifariş günü\" — tarixlə birlikdə paylaş.",
  ],
  region: [
    "Region üzrə pulsuz çatdırılma elanı: \"Bu həftə Gəncəyə pulsuz çatdırılma\" formatında post.",
    "Tap.az elan başlıqlarına region adını əlavə et — yerli axtarışlarda görünmə artır.",
    "Story-lərdə coğrafi yer stikeri istifadə et — yerli auditoriyaya daha asan çatırsan.",
    "Region müştəriləri üçün xüsusi WhatsApp təklif mesajı hazırla və yerli nömrələrə göndər.",
    "Yerli alıcı rəyini repost et: regiondan real müştəri təcrübəsi etibar yaradır.",
  ],
};

function buildIdeasPrompt(campaign: Campaign, typeKey: CampaignTypeKey): string {
  return `Sən Azərbaycan bazarında kiçik bizneslərə satış kampaniyaları üzrə kömək edən marketinq mütəxəssisisən.
Aşağıdakı kampaniya üçün 4-5 konkret, dərhal icra oluna bilən, satış yönümlü kontent ideyası hazırla (Azərbaycan dilində):

- Kampaniya adı: ${campaign.name}
- Tip: ${CAMPAIGN_TYPES[typeKey].label}
- Təsvir: ${campaign.description ?? "-"}
- Tarix aralığı: ${formatDate(campaign.startDate)} – ${formatDate(campaign.endDate)}

Qaydalar:
- Hər ideya 1-2 cümlə olsun və hansı platformada (Instagram, Tap.az, WhatsApp, Umico və s.) icra olunacağını qeyd etsin.
- İdeyalar konkret olsun: format, mexanika və ya çağırış göstərilsin.
- YALNIZ JSON massivi formatında cavab ver, başqa heç nə yazma:
["ideya 1", "ideya 2", "ideya 3", "ideya 4"]`;
}

export async function generateIdeas(id: number): Promise<ActionResult> {
  const campaign = db.select().from(campaigns).where(eq(campaigns.id, id)).get();
  if (!campaign) {
    return { ok: false, error: "Kampaniya tapılmadı" };
  }
  const typeKey = (campaign.type in CAMPAIGN_TYPES ? campaign.type : "endirim") as CampaignTypeKey;

  let ideas: string[] | null = null;

  if (aiAvailable()) {
    try {
      const { text } = await generateText({
        model: getAiModel(),
        prompt: buildIdeasPrompt(campaign, typeKey),
      });
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed: unknown = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => item.trim())
            .slice(0, 5);
          if (cleaned.length >= 3) {
            ideas = cleaned;
          }
        }
      }
    } catch (err) {
      console.error("AI ideya generasiyası xətası, hazır ideyalar istifadə olunur:", err);
    }
  }

  if (!ideas) {
    ideas = FALLBACK_IDEAS[typeKey];
  }

  db.update(campaigns).set({ ideas: JSON.stringify(ideas) }).where(eq(campaigns.id, id)).run();

  revalidatePath("/kampaniyalar");
  return { ok: true };
}
