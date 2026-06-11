// Şablon dəyişənləri və canlı önizləmə üçün nümunə data

export const TEMPLATE_VARIABLES = [
  { key: "mehsul", label: "Məhsul adı" },
  { key: "marka", label: "Marka" },
  { key: "model", label: "Model" },
  { key: "qiymet", label: "Qiymət" },
  { key: "endirimli_qiymet", label: "Endirimli qiymət" },
  { key: "zemanet", label: "Zəmanət" },
  { key: "catdirilma", label: "Çatdırılma" },
  { key: "tesvir", label: "Təsvir" },
  { key: "hashtaglar", label: "Hashtaglar" },
] as const;

export const SAMPLE_DATA: Record<string, string> = {
  mehsul: "Apple iPhone 16 Pro 256GB",
  marka: "Apple",
  model: "iPhone 16 Pro",
  qiymet: "2 899 ₼",
  endirimli_qiymet: "2 749 ₼",
  zemanet: "12 ay rəsmi zəmanət",
  catdirilma: "Bakı daxili pulsuz çatdırılma",
  tesvir: "A18 Pro prosessor, 48 MP kamera",
  hashtaglar: "#apple #iphone #baki",
};

// {deyisen} formasındakı dəyişənləri verilmiş data ilə əvəz edir
export function renderTemplate(content: string, data: Record<string, string>): string {
  return content.replace(/\{([a-z_]+)\}/g, (match, key: string) => data[key] ?? match);
}
