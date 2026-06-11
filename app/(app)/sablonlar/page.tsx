import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";
import { TemplatesView } from "@/components/templates/templates-view";

export const dynamic = "force-dynamic";

export default function TemplatesPage() {
  const items = db.select().from(templates).orderBy(desc(templates.createdAt)).all();

  return <TemplatesView items={items} />;
}
