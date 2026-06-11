import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  ClipboardList,
  Hash,
  SearchCheck,
  User,
} from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contents, products, teamMembers } from "@/lib/db/schema";
import { LANGUAGES, formatDate, formatPrice, type LanguageKey } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { CopyPanel } from "@/components/listings/copy-panel";
import { StatusActions } from "@/components/listings/status-actions";
import { EditContentDialog } from "@/components/listings/edit-content-dialog";
import { DeleteContentButton } from "@/components/listings/delete-content-button";
import { QualityScore, qualityColor } from "@/components/listings/quality-score";

export const dynamic = "force-dynamic";

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default async function ElanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contentId = Number(id);
  if (!Number.isInteger(contentId) || contentId <= 0) notFound();

  const content = db
    .select()
    .from(contents)
    .where(eq(contents.id, contentId))
    .get();
  if (!content) notFound();

  const product = db
    .select()
    .from(products)
    .where(eq(products.id, content.productId))
    .get();

  const approvedBy = content.approvedById
    ? db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.id, content.approvedById))
        .get()
    : undefined;

  const hashtags = parseJsonArray(content.hashtags);
  const seoKeywords = parseJsonArray(content.seoKeywords);
  const qualityIssues = parseJsonArray(content.qualityIssues);
  const languageLabel =
    LANGUAGES[content.language as LanguageKey]?.label ?? content.language;

  return (
    <div>
      <Link
        href="/elanlar"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="size-4" />
        Elanlara qayıt
      </Link>

      <PageHeader
        title={content.title}
        description={
          product ? `${product.name} • ${languageLabel}` : languageLabel
        }
      >
        <StatusBadge status={content.status} />
        <EditContentDialog
          contentId={content.id}
          title={content.title}
          body={content.body}
          hashtags={hashtags}
        />
        <DeleteContentButton contentId={content.id} title={content.title} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {qualityIssues.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-800">
              <AlertTriangle className="size-4 text-amber-600" />
              <AlertTitle>Keyfiyyət xəbərdarlıqları</AlertTitle>
              <AlertDescription className="text-amber-700">
                <ul className="list-disc space-y-1 pl-4">
                  {qualityIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-4 text-indigo-500" />
                Elan mətni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Başlıq
                </div>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {content.title}
                </p>
              </div>
              <Separator />
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Mətn
                </div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-zinc-700">
                  {content.body}
                </p>
              </div>

              {hashtags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
                      <Hash className="size-3.5" />
                      Hashtaglar
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {hashtags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-indigo-50 text-indigo-700"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {seoKeywords.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
                      <SearchCheck className="size-3.5" />
                      SEO açar sözlər
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {seoKeywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-zinc-600">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {content.qualityScore != null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Keyfiyyət balı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "text-3xl font-semibold tabular-nums",
                      qualityColor(content.qualityScore)
                    )}
                  >
                    {content.qualityScore}
                    <span className="text-base font-normal text-zinc-400">/100</span>
                  </span>
                  <Progress value={content.qualityScore} className="flex-1" />
                </div>
                {qualityIssues.length === 0 && (
                  <p className="mt-2 text-sm text-zinc-500">
                    Heç bir keyfiyyət problemi aşkar edilməyib.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kopyala və yerləşdir</CardTitle>
            </CardHeader>
            <CardContent>
              <CopyPanel
                title={content.title}
                body={content.body}
                hashtags={hashtags}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status əməliyyatları</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusActions contentId={content.id} status={content.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Məlumat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Platforma</span>
                <PlatformBadge platform={content.platform} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Dil</span>
                <span className="font-medium text-zinc-800">{languageLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Keyfiyyət balı</span>
                <QualityScore score={content.qualityScore} showMax />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Mənbə</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-zinc-800">
                  {content.generatedByAi === 1 ? (
                    <>
                      <Bot className="size-3.5 text-indigo-500" />
                      AI ilə yaradılıb
                    </>
                  ) : (
                    <>
                      <User className="size-3.5 text-zinc-400" />
                      Əl ilə yaradılıb
                    </>
                  )}
                </span>
              </div>
              {product && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">Məhsul</span>
                  <Link
                    href={`/mehsullar/${product.id}`}
                    className="max-w-44 truncate font-medium text-indigo-600 hover:underline"
                  >
                    {product.name}
                  </Link>
                </div>
              )}
              {product?.price != null && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">Qiymət</span>
                  <span className="font-medium text-zinc-800">
                    {formatPrice(product.salePrice ?? product.price)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Yaradılıb</span>
                <span className="text-zinc-700">{formatDate(content.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Yenilənib</span>
                <span className="text-zinc-700">{formatDate(content.updatedAt)}</span>
              </div>
              {content.publishedAt && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">Yerləşdirilib</span>
                  <span className="text-zinc-700">
                    {formatDate(content.publishedAt)}
                  </span>
                </div>
              )}
              {approvedBy && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">Təsdiqləyən</span>
                  <span className="font-medium text-zinc-800">{approvedBy.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
