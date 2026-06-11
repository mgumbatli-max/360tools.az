import { eq } from "drizzle-orm";
import { Bot, Zap } from "lucide-react";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { aiAvailable } from "@/lib/ai/generate";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { AiChat } from "@/components/ai-studio/chat";
import { QuickGenerate, type ProductOption } from "@/components/ai-studio/quick-generate";

export const dynamic = "force-dynamic";

export default function AiStudioPage() {
  const productRows: ProductOption[] = db
    .select({ id: products.id, name: products.name, category: products.category })
    .from(products)
    .where(eq(products.status, "aktiv"))
    .orderBy(products.name)
    .all();

  const aiOn = aiAvailable();

  return (
    <div>
      <PageHeader
        title="AI Studio"
        description="AI assistent ilə söhbət edin və ya bir kliklə platformaya uyğun kontent yaradın"
      >
        {aiOn ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            AI modeli aktivdir
          </Badge>
        ) : (
          <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600">
            Şablon rejimi
          </Badge>
        )}
      </PageHeader>

      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat" className="px-3">
            <Bot className="size-4" />
            AI Assistent
          </TabsTrigger>
          <TabsTrigger value="quick" className="px-3">
            <Zap className="size-4" />
            Sürətli generasiya
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-2">
          <AiChat />
        </TabsContent>

        <TabsContent value="quick" className="mt-2">
          <QuickGenerate products={productRows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
