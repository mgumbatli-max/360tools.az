"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { importProducts, type ImportRow } from "@/lib/actions/bulk";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Hədəf sahələr
const FIELDS: { key: keyof ImportRow | "skip"; label: string }[] = [
  { key: "skip", label: "— Atla —" },
  { key: "name", label: "Ad *" },
  { key: "brand", label: "Marka" },
  { key: "model", label: "Model" },
  { key: "category", label: "Kateqoriya" },
  { key: "price", label: "Qiymət" },
  { key: "salePrice", label: "Endirimli qiymət" },
  { key: "stock", label: "Stok" },
  { key: "warranty", label: "Zəmanət" },
  { key: "color", label: "Rəng" },
  { key: "delivery", label: "Çatdırılma" },
  { key: "note", label: "Qeyd" },
  { key: "images", label: "Şəkil URL-ləri" },
];
const FIELD_ITEMS: Record<string, string> = Object.fromEntries(FIELDS.map((f) => [f.key, f.label]));

// Başlıq adına görə avtomatik uyğunlaşdırma
const AUTO: Record<string, keyof ImportRow> = {
  ad: "name", name: "name", məhsul: "name", mehsul: "name",
  marka: "brand", brand: "brand",
  model: "model",
  kateqoriya: "category", category: "category",
  qiymət: "price", qiymet: "price", price: "price",
  endirim: "salePrice", "endirimli qiymət": "salePrice", saleprice: "salePrice",
  stok: "stock", stock: "stock", say: "stock",
  zəmanət: "warranty", zemanet: "warranty", warranty: "warranty",
  rəng: "color", reng: "color", color: "color",
  çatdırılma: "delivery", catdirilma: "delivery", delivery: "delivery",
  qeyd: "note", note: "note",
  şəkil: "images", sekil: "images", image: "images", images: "images", url: "images",
};

/** Sadə, kotirovkalı sahələri dəstəkləyən CSV parser. Ayırıcı avtomatik (, və ya ;). */
function parseCsv(text: string): string[][] {
  const trimmed = text.replace(/^﻿/, "").trim();
  if (!trimmed) return [];
  const firstLine = trimmed.split(/\r?\n/)[0];
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inQuotes) {
      if (ch === '"') {
        if (trimmed[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // ötür
    } else {
      field += ch;
    }
  }
  row.push(field);
  rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const SAMPLE = `ad,marka,model,kateqoriya,qiymet,endirim,stok,zemanet,reng
Apple iPhone 16 Pro,Apple,iPhone 16 Pro,Telefonlar,2899,2749,12,12 ay zəmanət,Qara
Samsung Galaxy S25,Samsung,Galaxy S25,Telefonlar,1999,,8,12 ay zəmanət,Boz`;

export function CsvImport() {
  const [raw, setRaw] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  function loadText(text: string) {
    const parsed = parseCsv(text);
    if (parsed.length < 1) {
      toast.error("CSV oxunmadı");
      return;
    }
    const [head, ...rest] = parsed;
    setHeaders(head);
    setDataRows(rest);
    setDone(null);
    // avtomatik uyğunlaşdırma
    const auto: Record<number, string> = {};
    head.forEach((h, idx) => {
      const norm = h.trim().toLocaleLowerCase("az");
      auto[idx] = AUTO[norm] ?? "skip";
    });
    setMapping(auto);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setRaw(text);
      loadText(text);
    };
    reader.readAsText(file, "utf-8");
  }

  const hasNameColumn = Object.values(mapping).includes("name");

  function buildRows(): ImportRow[] {
    return dataRows.map((cells) => {
      const obj: ImportRow = {};
      headers.forEach((_, idx) => {
        const field = mapping[idx];
        if (field && field !== "skip") {
          (obj as Record<string, string>)[field] = (cells[idx] ?? "").trim();
        }
      });
      return obj;
    });
  }

  function onImport() {
    if (!hasNameColumn) {
      toast.error("Ən azı bir sütunu 'Ad' sahəsinə bağlayın");
      return;
    }
    const rows = buildRows();
    startTransition(async () => {
      const res = await importProducts(rows);
      setDone(res);
      if (res.created > 0) toast.success(`${res.created} məhsul idxal olundu`);
      else toast.warning("Heç bir məhsul idxal olunmadı");
    });
  }

  const sampleUrl = `data:text/csv;charset=utf-8,${encodeURIComponent("﻿" + SAMPLE)}`;

  return (
    <div className="space-y-6">
      {done ? (
        <Card>
          <CardContent className="space-y-4 pt-1">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-8 text-emerald-500" />
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {done.created} məhsul idxal olundu
                </div>
                {done.skipped > 0 && (
                  <div className="text-sm text-muted-foreground">{done.skipped} sətir ötürüldü</div>
                )}
              </div>
            </div>
            {done.errors.length > 0 && (
              <Alert>
                <AlertTriangle />
                <AlertTitle>Ötürülən sətirlər</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {done.errors.slice(0, 8).map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button render={<Link href="/mehsullar" />}>Məhsullara bax</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDone(null);
                  setHeaders([]);
                  setDataRows([]);
                  setRaw("");
                }}
              >
                Yenidən idxal et
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>1. Fayl yükləyin və ya yapışdırın</span>
                <Button variant="ghost" size="sm" render={<a href={sampleUrl} download="numune.csv" />}>
                  <Download />
                  Nümunə CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center transition hover:bg-muted/50">
                <Upload className="size-7 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">CSV faylı seçin</span>
                <span className="text-xs text-muted-foreground">Excel-i CSV (UTF-8) kimi yadda saxlayın</span>
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
              </label>
              <div className="space-y-1.5">
                <Label>və ya mətni birbaşa yapışdırın</Label>
                <Textarea
                  value={raw}
                  rows={5}
                  placeholder="ad,marka,qiymet&#10;iPhone 16,Apple,2899"
                  onChange={(e) => setRaw(e.target.value)}
                  onBlur={() => raw.trim() && loadText(raw)}
                  className="font-mono text-xs"
                />
                {raw.trim() && headers.length === 0 && (
                  <Button size="sm" variant="outline" onClick={() => loadText(raw)}>
                    Mətni oxu
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {headers.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>2. Sütunları uyğunlaşdırın</CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasNameColumn && (
                    <Alert className="mb-4">
                      <AlertTriangle />
                      <AlertTitle>Ad sütunu seçilməyib</AlertTitle>
                      <AlertDescription>İdxal üçün ən azı bir sütun "Ad" sahəsinə bağlanmalıdır.</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {headers.map((h, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <Label className="truncate">
                          <FileSpreadsheet className="mr-1 inline size-3.5 text-muted-foreground" />
                          {h || `Sütun ${idx + 1}`}
                        </Label>
                        <Select
                          items={FIELD_ITEMS}
                          value={mapping[idx] ?? "skip"}
                          onValueChange={(v) => setMapping((prev) => ({ ...prev, [idx]: v ?? "skip" }))}
                        >
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FIELDS.map((f) => (
                              <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="py-0">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-semibold">3. Önizləmə ({dataRows.length} sətir)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((h, idx) => {
                            const field = mapping[idx];
                            return (
                              <TableHead key={idx}>
                                {FIELDS.find((f) => f.key === field)?.label ?? "Atla"}
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataRows.slice(0, 10).map((cells, ri) => (
                          <TableRow key={ri}>
                            {headers.map((_, ci) => {
                              const isName = mapping[ci] === "name";
                              const val = cells[ci] ?? "";
                              return (
                                <TableCell
                                  key={ci}
                                  className={
                                    isName && !val.trim()
                                      ? "text-red-500"
                                      : mapping[ci] === "skip"
                                        ? "text-muted-foreground/50"
                                        : ""
                                  }
                                >
                                  {isName && !val.trim() ? "(boş — ötürüləcək)" : val || "—"}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-3">
                <Button onClick={onImport} disabled={isPending || !hasNameColumn}>
                  {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
                  {dataRows.length} məhsulu idxal et
                </Button>
                <span className="text-xs text-muted-foreground">
                  Adı boş olan sətirlər avtomatik ötürülür.
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
