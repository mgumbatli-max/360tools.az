import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

// Runtime-da yüklənən şəkillər data/uploads qovluğunda saxlanılır (public/ deyil),
// çünki public/-a build-dən sonra əlavə olunan fayllar production-da servis olunmur.
// Vercel-də data/ read-only-dur — /tmp istifadə olunur.
const UPLOADS_DIR = process.env.VERCEL
  ? path.join("/tmp", "360tools-data", "uploads")
  : path.join(process.cwd(), "data", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  // Path traversal qarşısı — yalnız fayl adı qəbul olunur
  const fileName = path.basename(name);
  if (!fileName || fileName !== name) {
    return new NextResponse("Yanlış sorğu", { status: 400 });
  }

  try {
    const data = await readFile(path.join(UPLOADS_DIR, fileName));
    const ext = path.extname(fileName).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Şəkil tapılmadı", { status: 404 });
  }
}
