import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Sparkles, Package, Megaphone, ArrowRight, Pencil, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { products, contents } from "@/lib/db/schema";
import { formatPrice } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  { icon: Pencil, title: "Məhsulu yaz", text: "Ad, qiymət və bir-iki söz qeyd — bu qədər." },
  { icon: Sparkles, title: "AI kontent yaratsın", text: "Hər platforma üçün satış mətni avtomatik hazırlanır." },
  { icon: Megaphone, title: "Kopyala və paylaş", text: "Tap.az, Instagram, Birmarket — hazır mətni yerləşdir." },
];

export default function HomePage() {
  const recentProducts = db
    .select({ id: products.id, name: products.name, price: products.price, salePrice: products.salePrice })
    .from(products)
    .where(eq(products.status, "aktiv"))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(4)
    .all();

  const recentContents = db
    .select({
      id: contents.id,
      title: contents.title,
      status: contents.status,
      productName: products.name,
    })
    .from(contents)
    .leftJoin(products, eq(contents.productId, products.id))
    .orderBy(desc(contents.createdAt), desc(contents.id))
    .limit(5)
    .all();

  return (
    <div className="space-y-10">
      {/* Hero — əsas çağırış */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-12 text-center text-white sm:px-10 sm:py-16">
        <div className="relative z-10 mx-auto max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Məhsulunu peşəkar elana çevir
          </h1>
          <p className="mx-auto mt-3 max-w-md text-white/85">
            Şəkil və bir-iki söz kifayətdir. AI sənə Tap.az, Instagram və marketplace üçün hazır satış mətni verir.
          </p>
          <Button
            size="lg"
            className="mt-6 h-12 bg-white px-6 text-base text-indigo-700 hover:bg-white/90"
            render={<Link href="/yarat" />}
          >
            <Sparkles />
            Kontent yarat
          </Button>
        </div>
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 size-56 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Necə işləyir */}
      <div>
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Necə işləyir
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="size-6" />
              </div>
              <div className="flex items-center justify-center gap-2 text-base font-semibold">
                <span className="text-muted-foreground">{i + 1}.</span>
                {s.title}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Son məhsullar və kontentlər */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold">
              <Package className="size-4 text-muted-foreground" />
              Son məhsullar
            </h3>
            <Link href="/mehsullar" className="inline-flex items-center gap-1 text-sm font-medium text-brand">
              Hamısı <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {recentProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Hələ məhsul yoxdur</p>
          ) : (
            <ul className="space-y-1">
              {recentProducts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/mehsullar/${p.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {formatPrice(p.salePrice ?? p.price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="size-4 text-muted-foreground" />
              Son kontentlər
            </h3>
            <Link href="/elanlar" className="inline-flex items-center gap-1 text-sm font-medium text-brand">
              Hamısı <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {recentContents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Hələ kontent yoxdur</p>
          ) : (
            <ul className="space-y-1">
              {recentContents.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/elanlar/${c.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.productName}</span>
                    </span>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
