import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getPlatform } from "@/lib/platforms";
import { Button } from "@/components/ui/button";
import { ProfileEditor } from "@/components/platforms/profile-editor";
import type { PlatformFormValues } from "@/lib/actions/platforms";

export const dynamic = "force-dynamic";

function arr(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? (p as string[]) : [];
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ key: string }>;
}

export default async function PlatformEditorPage({ params }: PageProps) {
  const { key } = await params;
  const platform = getPlatform(key);
  if (!platform) notFound();

  const hasProduct = db.select({ id: products.id }).from(products).limit(1).get() != null;

  const initial: PlatformFormValues = {
    label: platform.label,
    icon: platform.icon ?? "📌",
    grp: platform.grp,
    enabled: platform.enabled === 1,
    defaultLanguage: platform.defaultLanguage,
    toneDefault: platform.toneDefault,
    emojiLevel: platform.emojiLevel,
    titleMaxLen: platform.titleMaxLen,
    bodyMinLen: platform.bodyMinLen,
    bodyMaxLen: platform.bodyMaxLen,
    hashtagMin: platform.hashtagMin,
    hashtagMax: platform.hashtagMax,
    structure: arr(platform.structure),
    ctaText: platform.ctaText ?? "",
    contactFormat: platform.contactFormat ?? "",
    forbiddenWords: arr(platform.forbiddenWords),
    preferredPhrases: arr(platform.preferredPhrases),
    extraInstructions: platform.extraInstructions ?? "",
    examples: arr(platform.examples),
    imageFormats: arr(platform.imageFormats),
  };

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" render={<Link href="/platformalar" />}>
          <ArrowLeft />
          Platformalar
        </Button>
      </div>
      <ProfileEditor
        platformKey={platform.key}
        isBuiltIn={platform.isBuiltIn === 1}
        initial={initial}
        hasProduct={hasProduct}
      />
    </div>
  );
}
