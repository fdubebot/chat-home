export function parseRevisionText(text: string): { date?: string; timePreferred?: string; partySize?: number } {
  const out: { date?: string; timePreferred?: string; partySize?: number } = {};
  const date = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (date) out.date = date[1];

  const time = text.match(/\b([01]?\d|2[0-3])[:h]([0-5]\d)\b/);
  if (time) out.timePreferred = `${time[1].padStart(2, "0")}:${time[2]}`;

  const party = text.match(/(?:party|for|size)\s*(\d{1,2})/i) || text.match(/\b(\d{1,2})\s*(people|persons|guests)\b/i);
  if (party) out.partySize = Number(party[1]);

  return out;
}

export function normalizePhone(input: string): string {
  const trimmed = String(input || "").trim();
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits;
}
