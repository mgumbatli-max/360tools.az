import { getPlatformOptions } from "@/lib/platforms";
import { CreateWizard } from "@/components/wizard/create-wizard";

export const dynamic = "force-dynamic";

export default function CreatePage() {
  return (
    <div className="py-2">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Kontent yarat
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Üç sadə addım: məhsulu yaz, şəkil at, platforma seç — AI peşəkar elan mətnini hazırlasın.
        </p>
      </div>
      <CreateWizard platforms={getPlatformOptions()} />
    </div>
  );
}
