import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type Db = BetterSQLite3Database<typeof schema>;

function iso(daysFromNow = 0, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function day(daysFromNow = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

// Built-in platforma profilləri — hər platformanın öz qaydaları ilə seed olunur.
// runSeed-dən ayrıdır ki, mövcud DB fayllarına da additiv əlavə oluna bilsin.
export function seedPlatforms(db: Db): void {
  const existing = db.select().from(schema.platforms).limit(1).all();
  if (existing.length > 0) return;

  const now = iso(0);
  const j = JSON.stringify;
  const FULL = j(["opener", "specs", "price", "warranty", "delivery", "cta"]);

  db.insert(schema.platforms)
    .values([
      {
        key: "tap-az", label: "Tap.az", icon: "🏷️", grp: "marketplace", isBuiltIn: 1, sortOrder: 10,
        toneDefault: "standart", emojiLevel: "light",
        titleMaxLen: 70, bodyMinLen: 80, bodyMaxLen: 4000, hashtagMin: 0, hashtagMax: 5,
        structure: FULL,
        ctaText: "Ətraflı məlumat üçün WhatsApp-a yazın!",
        imageFormats: j(["1:1", "16:9"]),
        createdAt: now, updatedAt: now,
      },
      {
        key: "instagram-post", label: "Instagram Post", icon: "📸", grp: "social", isBuiltIn: 1, sortOrder: 20,
        toneDefault: "standart", emojiLevel: "rich",
        titleMaxLen: 80, bodyMinLen: 60, bodyMaxLen: 2200, hashtagMin: 5, hashtagMax: 15,
        structure: FULL,
        ctaText: "Sifariş üçün DM və ya WhatsApp! 📲",
        imageFormats: j(["1:1", "4:5"]),
        createdAt: now, updatedAt: now,
      },
      {
        key: "instagram-story", label: "Instagram Story", icon: "📱", grp: "social", isBuiltIn: 1, sortOrder: 30,
        toneDefault: "genc", emojiLevel: "rich",
        titleMaxLen: 60, bodyMinLen: 20, bodyMaxLen: 300, hashtagMin: 0, hashtagMax: 3,
        structure: j(["opener", "price", "cta"]),
        ctaText: "Yuxarı sürüşdür və sifariş et! ⬆️",
        imageFormats: j(["9:16"]),
        createdAt: now, updatedAt: now,
      },
      {
        key: "instagram-reels", label: "Instagram Reels", icon: "🎬", grp: "social", isBuiltIn: 1, sortOrder: 40,
        toneDefault: "genc", emojiLevel: "rich",
        titleMaxLen: 80, bodyMinLen: 40, bodyMaxLen: 1000, hashtagMin: 5, hashtagMax: 10,
        structure: j(["opener", "specs", "price", "cta"]),
        ctaText: "Ətraflı üçün profilə keç! 📲",
        imageFormats: j(["9:16"]),
        createdAt: now, updatedAt: now,
      },
      {
        key: "birmarket", label: "Birmarket", icon: "🛒", grp: "marketplace", isBuiltIn: 1, sortOrder: 50,
        toneDefault: "resmi", emojiLevel: "none",
        titleMaxLen: 120, bodyMinLen: 80, bodyMaxLen: 3000, hashtagMin: 0, hashtagMax: 0,
        structure: j(["specs", "warranty", "delivery"]),
        extraInstructions: "Marketplace standartı: ad 'Marka Model Rəng' formatında, mətn faktiki və neytral, reklam şüarları olmasın.",
        imageFormats: j(["1:1"]),
        createdAt: now, updatedAt: now,
      },
      {
        key: "umico", label: "Umico", icon: "🛍️", grp: "marketplace", isBuiltIn: 1, sortOrder: 60,
        toneDefault: "resmi", emojiLevel: "none",
        titleMaxLen: 120, bodyMinLen: 80, bodyMaxLen: 3000, hashtagMin: 0, hashtagMax: 0,
        structure: j(["specs", "warranty", "delivery"]),
        extraInstructions: "Marketplace standartı: ad 'Marka Model Rəng' formatında, mətn faktiki və neytral, reklam şüarları olmasın.",
        imageFormats: j(["1:1"]),
        createdAt: now, updatedAt: now,
      },
      {
        key: "website", label: "Sayt (SEO)", icon: "🌐", grp: "web", isBuiltIn: 1, sortOrder: 70,
        toneDefault: "resmi", emojiLevel: "none",
        titleMaxLen: 60, bodyMinLen: 120, bodyMaxLen: 5000, hashtagMin: 0, hashtagMax: 0,
        structure: j(["opener", "specs", "warranty", "cta"]),
        extraInstructions: "SEO yönümlü: başlıq açar sözlə başlasın, mətn axtarış sistemləri üçün təbii oxunsun.",
        imageFormats: j(["16:9", "1:1"]),
        createdAt: now, updatedAt: now,
      },
      {
        key: "whatsapp", label: "WhatsApp Kataloq", icon: "💬", grp: "messaging", isBuiltIn: 1, sortOrder: 80,
        toneDefault: "standart", emojiLevel: "light",
        titleMaxLen: 80, bodyMinLen: 40, bodyMaxLen: 1000, hashtagMin: 0, hashtagMax: 0,
        structure: j(["opener", "price", "warranty", "delivery", "cta"]),
        ctaText: "Sifariş etmək istəyirsinizsə, bu mesaja cavab yazın.",
        imageFormats: j(["1:1"]),
        createdAt: now, updatedAt: now,
      },
      {
        key: "telegram", label: "Telegram Post", icon: "✈️", grp: "messaging", isBuiltIn: 1, sortOrder: 90,
        toneDefault: "standart", emojiLevel: "light",
        titleMaxLen: 90, bodyMinLen: 60, bodyMaxLen: 3500, hashtagMin: 0, hashtagMax: 5,
        structure: FULL,
        imageFormats: j(["1:1", "16:9"]),
        createdAt: now, updatedAt: now,
      },
      {
        key: "facebook-marketplace", label: "Facebook Marketplace", icon: "👥", grp: "marketplace", isBuiltIn: 1, sortOrder: 100,
        toneDefault: "standart", emojiLevel: "light",
        titleMaxLen: 100, bodyMinLen: 60, bodyMaxLen: 5000, hashtagMin: 0, hashtagMax: 5,
        structure: FULL,
        imageFormats: j(["1:1", "16:9"]),
        createdAt: now, updatedAt: now,
      },
    ])
    .run();
}

export function runSeed(db: Db): void {
  const existing = db.select().from(schema.teamMembers).limit(1).all();
  if (existing.length > 0) return;

  const now = iso(0);

  db.insert(schema.brandKit)
    .values({
      businessName: "TechStore Baku",
      primaryColor: "#4f46e5",
      secondaryColor: "#f59e0b",
      fontStyle: "Müasir sans-serif",
      phone: "+994 50 123 45 67",
      whatsapp: "https://wa.me/994501234567",
      instagram: "@techstore.baku",
      address: "Bakı şəh., Nizami küç. 45",
      deliveryPolicy: "Bakı daxili pulsuz çatdırılma, bölgələrə 1-3 iş günü",
      warrantyPolicy: "Bütün məhsullara 12 ay rəsmi zəmanət",
      slogan: "Texnologiya bir addım yaxında",
      salesMessages: JSON.stringify([
        "Sifariş üçün WhatsApp-a yazın 📲",
        "Stokda məhdud saydadır — tələsin!",
        "Kartla və nağd ödəniş mümkündür",
      ]),
      updatedAt: now,
    })
    .run();

  db.insert(schema.teamMembers)
    .values([
      { name: "Murad Qumbatlı", email: "m.gumbatli@gmail.com", role: "owner", avatarColor: "#4f46e5", createdAt: now },
      { name: "Aysel Məmmədova", email: "aysel@techstore.az", role: "content-manager", avatarColor: "#0ea5e9", createdAt: now },
      { name: "Tural Həsənov", email: "tural@techstore.az", role: "designer", avatarColor: "#f59e0b", createdAt: now },
      { name: "Nigar Əliyeva", email: "nigar@techstore.az", role: "sales-manager", avatarColor: "#10b981", createdAt: now },
      { name: "Elvin Quliyev", email: "elvin@techstore.az", role: "moderator", avatarColor: "#ef4444", createdAt: now },
    ])
    .run();

  db.insert(schema.products)
    .values([
      {
        name: "Apple iPhone 16 Pro 256GB",
        brand: "Apple",
        model: "iPhone 16 Pro",
        category: "Telefonlar",
        price: 2899,
        salePrice: 2749,
        stock: 12,
        warranty: "12 ay rəsmi zəmanət",
        color: "Titan qara",
        specs: JSON.stringify([
          { name: "Ekran", value: "6.3 düym Super Retina XDR" },
          { name: "Yaddaş", value: "256 GB" },
          { name: "Kamera", value: "48 MP əsas + 12 MP ultra geniş" },
          { name: "Prosessor", value: "A18 Pro" },
        ]),
        delivery: "Bakı daxili pulsuz çatdırılma",
        images: JSON.stringify([]),
        createdById: 2,
        createdAt: iso(-6),
        updatedAt: iso(-1),
      },
      {
        name: "Samsung Galaxy S25 Ultra 512GB",
        brand: "Samsung",
        model: "Galaxy S25 Ultra",
        category: "Telefonlar",
        price: 2599,
        stock: 8,
        warranty: "12 ay rəsmi zəmanət",
        color: "Titan boz",
        specs: JSON.stringify([
          { name: "Ekran", value: "6.9 düym Dynamic AMOLED 2X" },
          { name: "Yaddaş", value: "512 GB" },
          { name: "Kamera", value: "200 MP əsas" },
        ]),
        delivery: "Bakı daxili pulsuz çatdırılma",
        images: JSON.stringify([]),
        createdById: 2,
        createdAt: iso(-5),
        updatedAt: iso(-2),
      },
      {
        name: "Lenovo IdeaPad Slim 5 16IRL8",
        brand: "Lenovo",
        model: "IdeaPad Slim 5",
        category: "Kompüter və noutbuklar",
        price: 1450,
        salePrice: 1299,
        stock: 5,
        warranty: "24 ay zəmanət",
        color: "Boz",
        specs: JSON.stringify([
          { name: "Prosessor", value: "Intel Core i7-13620H" },
          { name: "RAM", value: "16 GB DDR5" },
          { name: "SSD", value: "512 GB NVMe" },
          { name: "Ekran", value: "16 düym WUXGA IPS" },
        ]),
        delivery: "Bölgələrə 1-3 iş günü",
        images: JSON.stringify([]),
        createdById: 2,
        createdAt: iso(-4),
        updatedAt: iso(-1),
      },
      {
        name: "Dyson V15 Detect Absolute tozsoran",
        brand: "Dyson",
        model: "V15 Detect",
        category: "Məişət texnikası",
        price: 1799,
        stock: 3,
        warranty: "24 ay rəsmi zəmanət",
        color: "Sarı/Nikel",
        specs: JSON.stringify([
          { name: "İş müddəti", value: "60 dəqiqəyə qədər" },
          { name: "Lazer detektor", value: "Var" },
        ]),
        delivery: "Bakı daxili pulsuz çatdırılma",
        images: JSON.stringify([]),
        createdById: 4,
        createdAt: iso(-3),
        updatedAt: iso(-3),
      },
      {
        name: "AirPods Pro 3 simsiz qulaqlıq",
        brand: "Apple",
        model: "AirPods Pro 3",
        category: "Elektronika",
        price: 549,
        salePrice: 499,
        stock: 25,
        warranty: "12 ay zəmanət",
        color: "Ağ",
        specs: JSON.stringify([
          { name: "Aktiv səs-küy ləğvi", value: "Var" },
          { name: "Batareya", value: "30 saata qədər (keyslə)" },
        ]),
        delivery: "Bakı daxili pulsuz çatdırılma",
        images: JSON.stringify([]),
        createdById: 2,
        createdAt: iso(-2),
        updatedAt: iso(-1),
      },
      {
        name: "Xiaomi Robot Vacuum X20 Pro",
        brand: "Xiaomi",
        model: "X20 Pro",
        category: "Məişət texnikası",
        price: 899,
        stock: 7,
        warranty: "12 ay zəmanət",
        color: "Ağ",
        specs: JSON.stringify([
          { name: "Sorma gücü", value: "7000 Pa" },
          { name: "Yaş təmizləmə", value: "Var" },
        ]),
        delivery: "Bölgələrə 1-3 iş günü",
        images: JSON.stringify([]),
        createdById: 4,
        createdAt: iso(-2),
        updatedAt: iso(-2),
      },
      {
        name: "Apple Watch Series 11 GPS 45mm",
        brand: "Apple",
        model: "Watch Series 11",
        category: "Elektronika",
        price: 1099,
        stock: 10,
        warranty: "12 ay rəsmi zəmanət",
        color: "Gecə mavisi",
        specs: JSON.stringify([
          { name: "Ekran", value: "Always-On Retina" },
          { name: "Su keçirməzlik", value: "50 m" },
        ]),
        delivery: "Bakı daxili pulsuz çatdırılma",
        images: JSON.stringify([]),
        createdById: 2,
        createdAt: iso(-1),
        updatedAt: iso(-1),
      },
      {
        name: "PlayStation 5 Slim Digital Edition",
        brand: "Sony",
        model: "PS5 Slim Digital",
        category: "Elektronika",
        price: 1349,
        salePrice: 1249,
        stock: 4,
        warranty: "12 ay zəmanət",
        color: "Ağ",
        specs: JSON.stringify([
          { name: "SSD", value: "1 TB" },
          { name: "Çözünürlük", value: "4K 120fps" },
        ]),
        delivery: "Bakı daxili pulsuz çatdırılma",
        images: JSON.stringify([]),
        createdById: 4,
        createdAt: iso(0, 9),
        updatedAt: iso(0, 9),
      },
    ])
    .run();

  db.insert(schema.contents)
    .values([
      {
        productId: 1,
        platform: "tap-az",
        title: "iPhone 16 Pro 256GB — Rəsmi zəmanətlə, endirimlə!",
        body: "Apple iPhone 16 Pro 256GB, Titan qara rəngdə.\n\n✅ A18 Pro prosessor\n✅ 48 MP kamera sistemi\n✅ 12 ay rəsmi zəmanət\n✅ Bakı daxili pulsuz çatdırılma\n\nQiymət: 2749 ₼ (əvvəlki qiymət 2899 ₼)\n\nƏtraflı məlumat üçün WhatsApp-a yazın!",
        hashtags: JSON.stringify(["iphone16pro", "apple", "baku"]),
        status: "yerlesdirildi",
        qualityScore: 92,
        generatedByAi: 1,
        approvedById: 1,
        publishedAt: iso(-1),
        createdAt: iso(-2),
        updatedAt: iso(-1),
      },
      {
        productId: 1,
        platform: "instagram-post",
        title: "Yeni iPhone 16 Pro artıq stokda! 🔥",
        body: "Titan qara iPhone 16 Pro — gücün və dizaynın mükəmməl birləşməsi. 📱✨\n\n💰 2749 ₼ — məhdud müddətli endirim\n🚚 Bakı daxili pulsuz çatdırılma\n🛡 12 ay rəsmi zəmanət\n\nSifariş üçün DM və ya WhatsApp! 📲",
        hashtags: JSON.stringify(["iphone16pro", "texnologiya", "baki", "apple", "telefon"]),
        status: "tesdiq-gozleyir",
        qualityScore: 88,
        generatedByAi: 1,
        createdAt: iso(-1),
        updatedAt: iso(-1),
      },
      {
        productId: 2,
        platform: "birmarket",
        title: "Samsung Galaxy S25 Ultra 512GB Titan boz",
        body: "Samsung Galaxy S25 Ultra flaqman smartfonu. 6.9 düym Dynamic AMOLED 2X ekran, 200 MP kamera, 512 GB daxili yaddaş. 12 ay rəsmi zəmanət. Qutusu açılmamış, yeni.",
        seoKeywords: JSON.stringify(["samsung s25 ultra", "galaxy s25", "samsung baku"]),
        status: "hazirdir",
        qualityScore: 85,
        generatedByAi: 1,
        createdAt: iso(-1),
        updatedAt: iso(0, 9),
      },
      {
        productId: 3,
        platform: "tap-az",
        title: "Lenovo IdeaPad Slim 5 — i7 / 16GB / 512GB SSD",
        body: "Lenovo IdeaPad Slim 5 16IRL8 noutbuku. Intel Core i7-13620H, 16 GB DDR5 RAM, 512 GB SSD, 16 düym WUXGA IPS ekran. İş və təhsil üçün ideal seçim. 24 ay zəmanət. Endirimli qiymət: 1299 ₼.",
        status: "qaralama",
        qualityScore: 74,
        qualityIssues: JSON.stringify(["Çatdırılma məlumatı əlavə edilməyib"]),
        generatedByAi: 1,
        createdAt: iso(0, 8),
        updatedAt: iso(0, 8),
      },
      {
        productId: 5,
        platform: "instagram-story",
        title: "AirPods Pro 3 endirimdə!",
        body: "🎧 AirPods Pro 3\n499 ₼ əvəzinə 549 ₼\n\nYuxarı sürüşdür və sifariş et! ⬆️",
        status: "yerlesdirildi",
        qualityScore: 90,
        generatedByAi: 1,
        approvedById: 1,
        publishedAt: iso(-1, 18),
        createdAt: iso(-1, 15),
        updatedAt: iso(-1, 18),
      },
      {
        productId: 4,
        platform: "umico",
        title: "Dyson V15 Detect Absolute simsiz tozsoran",
        body: "Dyson V15 Detect Absolute — lazer detektorlu premium simsiz tozsoran. 60 dəqiqəyə qədər iş müddəti, HEPA filtrasiya. 24 ay rəsmi zəmanət. Bakı daxili pulsuz çatdırılma.",
        seoKeywords: JSON.stringify(["dyson v15", "tozsoran", "dyson baku"]),
        status: "tesdiq-gozleyir",
        qualityScore: 87,
        generatedByAi: 1,
        createdAt: iso(0, 9),
        updatedAt: iso(0, 9),
      },
      {
        productId: 8,
        platform: "instagram-post",
        title: "PlayStation 5 Slim gəldi! 🎮",
        body: "PS5 Slim Digital Edition — 1249 ₼ endirimli qiymətlə! 🔥\n\n🎮 1 TB SSD\n📺 4K 120fps oyun təcrübəsi\n🛡 12 ay zəmanət\n\nStokda cəmi 4 ədəd qalıb — tələsin! Sifariş üçün DM. 📲",
        hashtags: JSON.stringify(["ps5", "playstation", "oyun", "baki", "gaming"]),
        status: "qaralama",
        qualityScore: 82,
        generatedByAi: 1,
        createdAt: iso(0, 11),
        updatedAt: iso(0, 11),
      },
      {
        productId: 7,
        platform: "website",
        title: "Apple Watch Series 11 GPS 45mm — TechStore Baku",
        body: "Apple Watch Series 11 GPS 45mm Gecə mavisi rəngdə. Always-On Retina ekran, 50 m su keçirməzlik, sağlamlıq sensorları. Rəsmi zəmanətlə TechStore Baku-dan sərfəli qiymətə alın.",
        seoKeywords: JSON.stringify(["apple watch series 11", "apple watch baku", "smart saat"]),
        status: "hazirdir",
        qualityScore: 89,
        generatedByAi: 1,
        createdAt: iso(-1, 12),
        updatedAt: iso(0, 9),
      },
      {
        productId: 6,
        platform: "tap-az",
        title: "Xiaomi Robot Vacuum X20 Pro — ağıllı təmizlik",
        body: "Xiaomi Robot Vacuum X20 Pro robot tozsoran. 7000 Pa sorma gücü, yaş və quru təmizləmə, ağıllı xəritələmə. 12 ay zəmanət. Qiymət: 899 ₼.",
        status: "xeta",
        qualityScore: 70,
        qualityIssues: JSON.stringify(["Platformaya yükləmə zamanı şəkil ölçüsü uyğun gəlmədi"]),
        generatedByAi: 1,
        createdAt: iso(-2, 14),
        updatedAt: iso(-1, 9),
      },
    ])
    .run();

  db.insert(schema.templates)
    .values([
      {
        name: "Standart Instagram postu",
        type: "instagram-post",
        platform: "instagram-post",
        content: "✨ {mehsul} artıq stokda!\n\n💰 Qiymət: {qiymet}\n🛡 {zemanet}\n🚚 {catdirilma}\n\nSifariş üçün DM və ya WhatsApp! 📲\n\n{hashtaglar}",
        isDefault: 1,
        createdAt: now,
      },
      {
        name: "Endirim elanı",
        type: "endirim",
        platform: "instagram-post",
        content: "🔥 ENDİRİM! {mehsul}\n\n❌ Köhnə qiymət: {qiymet}\n✅ Yeni qiymət: {endirimli_qiymet}\n\nMəhdud müddətli təklif — tələsin! ⏳\n\n{hashtaglar}",
        isDefault: 1,
        createdAt: now,
      },
      {
        name: "Tap.az standart elan",
        type: "tap-az-metn",
        platform: "tap-az",
        content: "{mehsul} — {marka} {model}\n\n{tesvir}\n\n✅ {zemanet}\n✅ {catdirilma}\n\nQiymət: {qiymet}\n\nƏlaqə üçün WhatsApp-a yazın!",
        isDefault: 1,
        createdAt: now,
      },
      {
        name: "Story endirim şablonu",
        type: "story",
        platform: "instagram-story",
        content: "⚡ {mehsul}\n{endirimli_qiymet} əvəzinə {qiymet}\n\nYuxarı sürüşdür! ⬆️",
        isDefault: 0,
        createdAt: now,
      },
      {
        name: "WhatsApp kataloq mesajı",
        type: "whatsapp",
        platform: "whatsapp",
        content: "Salam! 👋\n\n*{mehsul}*\nQiymət: {qiymet}\n{zemanet}\n\nSifariş etmək istəyirsinizsə, bu mesaja cavab yazın.",
        isDefault: 1,
        createdAt: now,
      },
      {
        name: "Yeni məhsul anonsu",
        type: "yeni-mehsul",
        platform: "instagram-post",
        content: "🆕 YENİLİK! {mehsul} artıq bizdə!\n\n{tesvir}\n\n💰 {qiymet}\n📲 Sifariş üçün DM\n\n{hashtaglar}",
        isDefault: 0,
        createdAt: now,
      },
    ])
    .run();

  db.insert(schema.tasks)
    .values([
      {
        title: "iPhone 16 Pro üçün Instagram postunu təsdiqə göndər",
        assigneeId: 2,
        productId: 1,
        status: "icrada",
        priority: "yuksek",
        dueDate: day(1),
        createdAt: iso(-1),
      },
      {
        title: "Dyson V15 üçün Umico elanını yoxla",
        assigneeId: 5,
        productId: 4,
        status: "gozleyir",
        priority: "orta",
        dueDate: day(1),
        createdAt: iso(0, 9),
      },
      {
        title: "PS5 Slim üçün story dizaynı hazırla",
        assigneeId: 3,
        productId: 8,
        status: "gozleyir",
        priority: "yuksek",
        dueDate: day(2),
        createdAt: iso(0, 10),
      },
      {
        title: "Xiaomi robot tozsoran elanının şəkil xətasını düzəlt",
        assigneeId: 3,
        productId: 6,
        status: "gecikir",
        priority: "yuksek",
        dueDate: day(-1),
        createdAt: iso(-2),
      },
      {
        title: "Həftəlik kontent planını hazırla",
        assigneeId: 2,
        status: "gozleyir",
        priority: "orta",
        dueDate: day(3),
        createdAt: iso(0, 9),
      },
      {
        title: "Lenovo noutbuk üçün Tap.az elanına çatdırılma məlumatı əlavə et",
        assigneeId: 2,
        productId: 3,
        status: "bitdi",
        priority: "asagi",
        dueDate: day(0),
        createdAt: iso(-1),
      },
    ])
    .run();

  db.insert(schema.calendarEntries)
    .values([
      { title: "iPhone 16 Pro postu", type: "post", platform: "instagram-post", date: day(1), contentId: 2, status: "planlanib", createdAt: now },
      { title: "AirPods endirim story", type: "story", platform: "instagram-story", date: day(-1), contentId: 5, status: "paylasilib", createdAt: now },
      { title: "PS5 Slim anons postu", type: "yeni-mehsul", platform: "instagram-post", date: day(2), contentId: 7, status: "planlanib", createdAt: now },
      { title: "Həftəsonu endirim kampaniyası", type: "endirim", platform: "instagram-post", date: day(4), status: "planlanib", createdAt: now },
      { title: "Qurban bayramı təbrik postu", type: "bayram", platform: "instagram-post", date: day(7), status: "planlanib", createdAt: now },
      { title: "Dyson məhsul təqdimatı", type: "post", platform: "instagram-reels", date: day(5), status: "planlanib", createdAt: now },
      { title: "Smart saat müqayisə postu", type: "post", platform: "instagram-post", date: day(8), status: "planlanib", createdAt: now },
      { title: "Robot tozsoran demo reels", type: "post", platform: "instagram-reels", date: day(10), status: "planlanib", createdAt: now },
    ])
    .run();

  db.insert(schema.campaigns)
    .values([
      {
        name: "Yay texnologiya endirimi",
        type: "endirim",
        description: "Seçilmiş telefon və aksesuarlarda 10%-ə qədər endirim",
        startDate: day(-3),
        endDate: day(7),
        status: "aktiv",
        ideas: JSON.stringify([
          "Instagram karusel: əvvəl/sonra qiymət müqayisəsi",
          "Story geri sayım stikeri ilə son 3 gün xatırlatması",
          "Tap.az elanlarının başlığına '🔥 Endirim' əlavə edilməsi",
        ]),
        createdAt: iso(-3),
      },
      {
        name: "PS5 yeni məhsul kampaniyası",
        type: "yeni-mehsul",
        description: "PS5 Slim Digital gəlişi ilə bağlı anons seriyası",
        startDate: day(0),
        endDate: day(5),
        status: "qaralama",
        ideas: JSON.stringify([
          "Unboxing reels videosu",
          "İlk 3 alıcıya oyun hədiyyəsi aksiyası",
        ]),
        createdAt: iso(0, 11),
      },
      {
        name: "Qurban bayramı kampaniyası",
        type: "bayram",
        description: "Bayram həftəsində məişət texnikasında xüsusi təkliflər",
        startDate: day(5),
        endDate: day(12),
        status: "qaralama",
        ideas: JSON.stringify([
          "Bayram təbriki + hədiyyə ideyaları postu",
          "Dyson və Xiaomi məhsullarına bayram endirimi",
        ]),
        createdAt: iso(0, 12),
      },
    ])
    .run();

  db.insert(schema.activities)
    .values([
      { memberId: 2, action: "Yeni məhsul əlavə etdi", target: "PlayStation 5 Slim Digital Edition", createdAt: iso(0, 9) },
      { memberId: 2, action: "AI ilə kontent yaratdı", target: "PS5 Slim — Instagram Post", createdAt: iso(0, 11) },
      { memberId: 1, action: "Kontenti təsdiqlədi", target: "iPhone 16 Pro — Tap.az", createdAt: iso(-1, 16) },
      { memberId: 4, action: "Elanı yerləşdirdi", target: "iPhone 16 Pro — Tap.az", createdAt: iso(-1, 17) },
      { memberId: 3, action: "Şəkil düzəlişi etdi", target: "AirPods Pro 3 — ağ fon", createdAt: iso(-1, 14) },
      { memberId: 2, action: "AI ilə kontent yaratdı", target: "Dyson V15 — Umico", createdAt: iso(0, 9) },
      { memberId: 5, action: "Kontenti yoxlamaya götürdü", target: "Dyson V15 — Umico", createdAt: iso(0, 10) },
      { memberId: 1, action: "Kampaniya yaratdı", target: "Qurban bayramı kampaniyası", createdAt: iso(0, 12) },
      { memberId: 2, action: "Təqvimə paylaşım planladı", target: "PS5 Slim anons postu", createdAt: iso(0, 12) },
      { memberId: 4, action: "Elan xətasını qeyd etdi", target: "Xiaomi X20 Pro — Tap.az", createdAt: iso(-1, 9) },
    ])
    .run();
}
