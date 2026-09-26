import type { AttendanceMethod } from "@prisma/client";

export const METHOD_LABEL: Record<AttendanceMethod, string> = { QR: "QR", DIRECT: "Langsung" };

/** "15.50.00 · Langsung" — time plus how the check-in/out was made. */
export function timeWithMethod(time: string, method: AttendanceMethod | null): string {
  return method ? `${time} · ${METHOD_LABEL[method]}` : time;
}
