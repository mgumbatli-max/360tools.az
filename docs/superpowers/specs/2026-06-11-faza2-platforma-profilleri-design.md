# Faza 2 — Öyrədilə bilən Platforma Profilləri və 10/10 Səviyyə

Tarix: 2026-06-11

## Analiz: kontent əməliyyat sistemini "ideal" edən nədir

MVP-nin birinci fazası "məhsul → AI kontent → approval → export" axınını qurur.
Amma real kontent menecerinin gündəlik ağrısı bundan dərindir. 10/10 sistem
üçün dörd prinsip:

1. **Minimum klik prinsipi.** Məhsuldan dərc olunmuş elana qədər yol 3 klikdən
   uzun olmamalıdır. Bulk əməliyyatlar (100 məhsul → bir kliklə bütün
   platformalara kontent) birinci dərəcəli funksiyadır, əlavə deyil.
2. **Uyğunlaşma > şablon.** Hər mağazanın hər platformada öz üslubu var.
   Sistem sabit 10 platforma formatı ilə kifayətlənə bilməz — istifadəçi
   **öz platformasını əlavə edib sistemi ona öyrətməlidir**: "Tap.az-da
   başlıq belə olsun, bu sözlər işlənsin, şəkil 1:1 olsun; Birmarket-də
   emoji olmasın, texniki parametrlər cədvəl kimi getsin".
3. **Etibar qapıları.** AI nə qədər yaxşı olsa da, biznes yanlış məlumatlı
   elanı bağışlamır. Keyfiyyət balı, qadağan sözlər, approval axını —
   bunlar platforma qaydalarından bəslənməlidir, hard-code olmamalıdır.
4. **Komanda ritmi.** Kontent işi təqvim üzərində yaşayır: 30 günlük plan,
   kim nəyi hazırlayır, nə gecikir — bir baxışda.

## Əsas yenilik: Platforma Profilləri (DB-driven, öyrədilə bilən)

### Verilənlər modeli — yeni `platforms` cədvəli

| Sahə | Təyinat |
|------|---------|
| key, label, icon, grp | identifikasiya (key unikal slug) |
| isBuiltIn, enabled, sortOrder | idarəetmə (built-in 10 platforma seed olunur) |
| toneDefault | standart / premium / genc / resmi |
| emojiLevel | none / light / rich |
| titleMaxLen, bodyMinLen, bodyMaxLen | mətn limitləri (keyfiyyət yoxlaması bunlardan oxuyur) |
| hashtagMin, hashtagMax | hashtag sayı qaydası |
| structure (JSON) | blokların sırası/aktivliyi: opener, specs, price, warranty, delivery, cta, hashtags |
| ctaText, contactFormat | çağırış mətni və əlaqə formatı |
| forbiddenWords, preferredPhrases (JSON) | söz qaydaları |
| extraInstructions | sərbəst təlimat — platformanın "sistem promptu" |
| examples (JSON) | istifadəçinin yapışdırdığı nümunə postlar — AI üçün few-shot üslub nümunələri |
| imageFormats (JSON) | bu platforma üçün uyğun şəkil nisbətləri |
| defaultLanguage | az / ru / en |

### "Sistemi öyrət" axını

1. İstifadəçi platforma əlavə edir (və ya built-in-i açır).
2. Qaydaları formada doldurur **və/və ya** bəyəndiyi 1-3 real post nümunəsini
   yapışdırır.
3. AI mövcuddursa "Nümunələrdən qaydaları çıxar" düyməsi nümunələri analiz
   edib limitləri/ton/emoji səviyyəsini avtomatik doldurur.
4. Canlı preview: seçilmiş nümunə məhsulla bu profil altında kontent necə
   görünəcək — dəyişiklik anında görünür.
5. Bundan sonra həmin platforma üçün BÜTÜN generasiyalar (məhsul detalı,
   AI Studio, bulk) bu profildən keçir.

### Generator inteqrasiyası

- `generatePlatformContent` profil qəbul edir: AI yolunda qaydalar + nümunələr
  prompt-a daxil edilir; fallback yolunda built-in şablonlar profil
  məhdudiyyətləri ilə süzülür (başlıq kəsilir, hashtag sayı tənzimlənir,
  CTA əvəzlənir, emoji səviyyəsi tətbiq olunur), custom platformalar üçün
  struktur bloklarından generic qurucu işləyir.
- `qualityCheck` limitləri profildən oxuyur; qadağan söz tapılarsa bal düşür
  və issue qeyd olunur.

## Digər Faza 2 əlavələri

1. **Bulk idxal və bulk generasiya** — `/mehsullar/import`: CSV yüklə/yapışdır
   → önizləmə → idxal. Məhsul siyahısında checkbox seçimi → "Seçilmişlər üçün
   kontent yarat" (platforma multi-select) → toplu generasiya.
2. **30 günlük AI kontent planı** — təqvimdə bir düymə: məhsullar, kampaniya
   növləri və platformalar üzərində balanslı aylıq plan yaradılır (AI varsa
   ideya səviyyəsində zənginləşdirilir).
3. **Platforma seçimlərinin DB-dən oxunması** — bütün modullardakı platforma
   selectləri artıq `platforms` cədvəlindən (yalnız enabled) gəlir;
   PlatformBadge custom platformaların etiket/ikonunu göstərə bilir.

## Miqrasiya qeydləri

- `PLATFORMS` konstantı seed mənbəyi və son fallback kimi qalır — mövcud kod
  qırılmır, lakin UI mənbəyi DB olur.
- Cədvəl additive əlavə olunur (CREATE TABLE IF NOT EXISTS) — mövcud DB
  fayllarında migrasiya tələb olunmur; boş cədvəl ilk açılışda built-in
  platformalarla seed olunur.
