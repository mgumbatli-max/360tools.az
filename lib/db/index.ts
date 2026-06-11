import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";
import { runSeed, seedPlatforms } from "./seed";

const DB_PATH = path.join(process.cwd(), "data", "360tools.db");

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  category TEXT NOT NULL DEFAULT 'Digər',
  price REAL,
  sale_price REAL,
  stock INTEGER DEFAULT 0,
  warranty TEXT,
  color TEXT,
  size TEXT,
  specs TEXT,
  delivery TEXT,
  note TEXT,
  images TEXT,
  status TEXT NOT NULL DEFAULT 'aktiv',
  created_by_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'az',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  hashtags TEXT,
  seo_keywords TEXT,
  status TEXT NOT NULL DEFAULT 'qaralama',
  quality_score INTEGER,
  quality_issues TEXT,
  generated_by_ai INTEGER NOT NULL DEFAULT 1,
  approved_by_id INTEGER,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS brand_kit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4f46e5',
  secondary_color TEXT DEFAULT '#f59e0b',
  font_style TEXT DEFAULT 'Müasir sans-serif',
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  address TEXT,
  delivery_policy TEXT,
  warranty_policy TEXT,
  slogan TEXT,
  sales_messages TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  platform TEXT,
  content TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'content-manager',
  avatar_color TEXT DEFAULT '#4f46e5',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id INTEGER,
  product_id INTEGER,
  status TEXT NOT NULL DEFAULT 'gozleyir',
  priority TEXT NOT NULL DEFAULT 'orta',
  due_date TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS calendar_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'post',
  platform TEXT,
  date TEXT NOT NULL,
  content_id INTEGER,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'planlanib',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'endirim',
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'qaralama',
  ideas TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS platforms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT DEFAULT '📌',
  grp TEXT NOT NULL DEFAULT 'custom',
  is_built_in INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  tone_default TEXT NOT NULL DEFAULT 'standart',
  emoji_level TEXT NOT NULL DEFAULT 'light',
  title_max_len INTEGER NOT NULL DEFAULT 90,
  body_min_len INTEGER NOT NULL DEFAULT 60,
  body_max_len INTEGER NOT NULL DEFAULT 2200,
  hashtag_min INTEGER NOT NULL DEFAULT 0,
  hashtag_max INTEGER NOT NULL DEFAULT 10,
  structure TEXT,
  cta_text TEXT,
  contact_format TEXT,
  forbidden_words TEXT,
  preferred_phrases TEXT,
  extra_instructions TEXT,
  examples TEXT,
  image_formats TEXT,
  default_language TEXT NOT NULL DEFAULT 'az',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER,
  action TEXT NOT NULL,
  target TEXT,
  created_at TEXT NOT NULL
);
`;

type DrizzleDb = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as { __360toolsDb?: DrizzleDb };

function createDb(): DrizzleDb {
  const fs = require("fs") as typeof import("fs");
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(BOOTSTRAP_SQL);
  const db = drizzle(sqlite, { schema });
  runSeed(db);
  seedPlatforms(db); // additiv — mövcud DB fayllarında da boşdursa doldurur
  return db;
}

export const db: DrizzleDb = globalForDb.__360toolsDb ?? createDb();
globalForDb.__360toolsDb = db;

export * from "./schema";
