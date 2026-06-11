# 360tools.az — MVP Dizayn Sənədi

Tarix: 2026-06-11

## Məqsəd

Bizneslər üçün AI əsaslı kontent hazırlama və multi-platforma elan yerləşdirmə
platformasının MVP versiyası. İstifadəçi məhsul məlumatını daxil edir, sistem
Tap.az, Instagram, Birmarket, Umico, sayt, WhatsApp, Telegram və Facebook
Marketplace üçün satış yönümlü kontenti avtomatik yaradır, keyfiyyət yoxlaması
aparır və approval axını ilə idarə edir.

## Texnoloji yığın

| Qat | Seçim | Səbəb |
|-----|-------|-------|
| Framework | Next.js 16 (App Router, Turbopack) | Server Components + Server Actions, Vercel-ə birbaşa deploy |
| UI | Tailwind CSS v4 + shadcn/ui (base-nova) | Professional, vahid dizayn sistemi |
| DB | SQLite (better-sqlite3) + Drizzle ORM | Sıfır konfiqurasiya ilə lokal işləyir; sonradan Postgres-ə (Neon) keçid asandır |
| AI | AI SDK v6 + Vercel AI Gateway (`anthropic/claude-sonnet-4-6`) | Açar yoxdursa deterministik Azərbaycan dilində şablon generatoruna fallback |
| Qrafiklər | Recharts | Analitika modulu üçün |

## Arxitektura qərarları

1. **AI fallback prinsipi** — `lib/ai/generate.ts` əvvəl AI Gateway-i yoxlayır
   (`AI_GATEWAY_API_KEY`), yoxdursa və ya xəta versə platforma-spesifik
   deterministik şablonlarla kontent yaradır. Demo açarsız tam işləyir.
2. **DB bootstrap** — `lib/db/index.ts` ilk müraciətdə `CREATE TABLE IF NOT
   EXISTS` + seed işlədir; migrasiya aləti tələb olunmur. DB faylı `data/`
   qovluğunda saxlanılır (gitignore-da).
3. **Keyfiyyət yoxlaması** — `qualityCheck()` qayda-əsaslıdır (başlıq uzunluğu,
   mətn limiti, qiymət/zəmanət/şəkil mövcudluğu, platforma limitləri) və hər
   kontentə 0-100 bal verir.
4. **Bütün səhifələr `force-dynamic`** — SQLite sorğuları build vaxtı yox,
   request vaxtı işləsin.
5. **Dil** — UI tam Azərbaycan dilində; kontent az/ru/en dillərində yaradıla bilir.

## Modullar və marşrutlar

| Marşrut | Modul |
|---------|-------|
| `/` | Dashboard — statistika, platforma statusları, komanda fəaliyyəti |
| `/mehsullar` | Məhsul siyahısı, filterlər, yeni məhsul formu, detal səhifə + AI kontent yaratma |
| `/ai-studio` | AI çat assistenti + sürətli generasiya alətləri |
| `/elanlar` | Bütün kontentlər, status workflow (Qaralama→Hazırdır→Təsdiq gözləyir→Yerləşdirildi), copy-paste paneli, CSV export |
| `/sekiller` | Şəkil qalereyası, format presetləri (1:1, 4:5, 9:16, 16:9), AI düzəliş pipeline-ı (UI hazır, xarici API sonra) |
| `/sablonlar` | Şablon CRUD ({mehsul}, {qiymet} dəyişənləri ilə) |
| `/teqvim` | Kontent təqvimi — ay görünüşü, planlama |
| `/kampaniyalar` | Kampaniya generatoru və siyahısı |
| `/platformalar` | Platforma bağlantıları statusu (API/copy-paste) |
| `/komanda` | Üzvlər, rollar, tapşırıqlar |
| `/analitika` | Kontent performansı qrafikləri |
| `/ayarlar` | Brand Kit |

## Verilənlər modeli (lib/db/schema.ts)

`products`, `contents` (platforma+dil+status+keyfiyyət balı), `brand_kit`,
`templates`, `team_members`, `tasks`, `calendar_entries`, `campaigns`,
`activities`. JSON sahələri TEXT sütunlarında saxlanılır (specs, images,
hashtags, seoKeywords).

## MVP-dən kənarda qalanlar (gələcək mərhələ)

- Real platforma API inteqrasiyaları (Tap.az, Instagram Graph API və s.) —
  MVP-də copy-paste paneli verilir
- Real AI şəkil emalı (fon silmə, retuş) — xarici servis açarı tələb edir
- ERP (360biznes.az) inteqrasiyası — webhook/REST interfeysi sonra
- Rəqib analizi modulu
- Autentifikasiya və multi-tenant SaaS billing
