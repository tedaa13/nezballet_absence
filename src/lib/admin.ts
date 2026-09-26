import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

export type ActionResult = { ok: boolean; message: string } | null;

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** "YYYY-MM-DD" for a date-only column (stored as midnight UTC), for <input type="date">. */
export function toDateInput(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function optionalString(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

export function optionalNumber(formData: FormData, key: string): number | null {
  const value = optionalString(formData, key);
  return value === null ? null : Number(value);
}
