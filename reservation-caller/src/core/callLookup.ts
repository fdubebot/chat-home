import { listCalls } from "./store.js";
import { normalizePhone } from "./helpers.js";

export async function findRecentCallByPhone(phone: string) {
  const target = normalizePhone(phone);
  const calls = await listCalls();
  const recent = calls
    .filter((c) => normalizePhone(c.reservation.businessPhone) === target)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return recent[0];
}
