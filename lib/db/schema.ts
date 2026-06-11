import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Məhsullar
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  brand: text("brand"),
  model: text("model"),
  category: text("category").notNull().default("Digər"),
  price: real("price"),
  salePrice: real("sale_price"),
  stock: integer("stock").default(0),
  warranty: text("warranty"),
  color: text("color"),
  size: text("size"),
  specs: text("specs"), // JSON: [{name, value}]
  delivery: text("delivery"),
  note: text("note"),
  images: text("images"), // JSON: string[] (URL və ya /uploads yolu)
  status: text("status").notNull().default("aktiv"), // aktiv | arxiv
  createdById: integer("created_by_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Platforma üzrə yaradılmış kontentlər
export const contents = sqliteTable("contents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  platform: text("platform").notNull(), // PlatformKey
  language: text("language").notNull().default("az"), // az | ru | en
  title: text("title").notNull(),
  body: text("body").notNull(),
  hashtags: text("hashtags"), // JSON: string[]
  seoKeywords: text("seo_keywords"), // JSON: string[]
  status: text("status").notNull().default("qaralama"), // ContentStatusKey
  qualityScore: integer("quality_score"), // 0-100
  qualityIssues: text("quality_issues"), // JSON: string[]
  generatedByAi: integer("generated_by_ai").notNull().default(1),
  approvedById: integer("approved_by_id"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Brand Kit (tək sətirlik konfiqurasiya)
export const brandKit = sqliteTable("brand_kit", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessName: text("business_name").notNull().default(""),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#4f46e5"),
  secondaryColor: text("secondary_color").default("#f59e0b"),
  fontStyle: text("font_style").default("Müasir sans-serif"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  instagram: text("instagram"),
  address: text("address"),
  deliveryPolicy: text("delivery_policy"),
  warrantyPolicy: text("warranty_policy"),
  slogan: text("slogan"),
  salesMessages: text("sales_messages"), // JSON: string[]
  updatedAt: text("updated_at").notNull(),
});

// Şablonlar
export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // TemplateTypeKey
  platform: text("platform"), // PlatformKey (istəyə bağlı)
  content: text("content").notNull(), // {mehsul}, {qiymet}, {marka} kimi dəyişənlərlə mətn
  isDefault: integer("is_default").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// Komanda üzvləri
export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").notNull().default("content-manager"), // TeamRoleKey
  avatarColor: text("avatar_color").default("#4f46e5"),
  createdAt: text("created_at").notNull(),
});

// Tapşırıqlar
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  assigneeId: integer("assignee_id"),
  productId: integer("product_id"),
  status: text("status").notNull().default("gozleyir"), // TaskStatusKey
  priority: text("priority").notNull().default("orta"), // TaskPriorityKey
  dueDate: text("due_date"),
  createdAt: text("created_at").notNull(),
});

// Kontent təqvimi
export const calendarEntries = sqliteTable("calendar_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  type: text("type").notNull().default("post"), // CalendarEntryTypeKey
  platform: text("platform"), // PlatformKey
  date: text("date").notNull(), // YYYY-MM-DD
  contentId: integer("content_id"),
  note: text("note"),
  status: text("status").notNull().default("planlanib"), // planlanib | paylasilib
  createdAt: text("created_at").notNull(),
});

// Kampaniyalar
export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull().default("endirim"), // CampaignTypeKey
  description: text("description"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").notNull().default("qaralama"), // qaralama | aktiv | bitdi
  ideas: text("ideas"), // JSON: AI tərəfindən yaradılmış ideyalar/mətnlər
  createdAt: text("created_at").notNull(),
});

// Platforma profilləri — istifadəçi öz platformasını əlavə edib sistemi ona "öyrədə" bilir.
// Built-in platformalar seed olunur; bütün generasiya qaydaları buradan oxunur.
export const platforms = sqliteTable("platforms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  icon: text("icon").default("📌"),
  grp: text("grp").notNull().default("custom"), // PlatformGroupKey
  isBuiltIn: integer("is_built_in").notNull().default(0),
  enabled: integer("enabled").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(100),
  toneDefault: text("tone_default").notNull().default("standart"), // ToneKey
  emojiLevel: text("emoji_level").notNull().default("light"), // EmojiLevelKey
  titleMaxLen: integer("title_max_len").notNull().default(90),
  bodyMinLen: integer("body_min_len").notNull().default(60),
  bodyMaxLen: integer("body_max_len").notNull().default(2200),
  hashtagMin: integer("hashtag_min").notNull().default(0),
  hashtagMax: integer("hashtag_max").notNull().default(10),
  structure: text("structure"), // JSON: StructureBlockKey[] — blokların sırası
  ctaText: text("cta_text"),
  contactFormat: text("contact_format"),
  forbiddenWords: text("forbidden_words"), // JSON: string[]
  preferredPhrases: text("preferred_phrases"), // JSON: string[]
  extraInstructions: text("extra_instructions"), // platformanın sərbəst "sistem promptu"
  examples: text("examples"), // JSON: string[] — istifadəçinin nümunə postları (few-shot)
  imageFormats: text("image_formats"), // JSON: ImageFormatKey[]
  defaultLanguage: text("default_language").notNull().default("az"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Fəaliyyət jurnalı
export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id"),
  action: text("action").notNull(), // Azərbaycan dilində təsvir
  target: text("target"), // məs. məhsul adı
  createdAt: text("created_at").notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Content = typeof contents.$inferSelect;
export type NewContent = typeof contents.$inferInsert;
export type BrandKit = typeof brandKit.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type CalendarEntry = typeof calendarEntries.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Platform = typeof platforms.$inferSelect;
export type NewPlatform = typeof platforms.$inferInsert;
