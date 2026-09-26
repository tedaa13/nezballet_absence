import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ActionResult = { ok: boolean; message: string } | null;

export type AdminScope = {
  userId: number;
  isSuperadmin: boolean;
  /** Branches this admin may touch; null = all (superadmin). */
  branchIds: number[] | null;
};

/** The logged-in admin and which branches they manage. Read from the DB so branch changes apply immediately. */
export async function requireAdmin(): Promise<AdminScope> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    include: { branches: { select: { id: true } } },
  });
  if (!user || user.status !== "ACTIVE" || (user.role !== "SUPERADMIN" && user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
  const isSuperadmin = user.role === "SUPERADMIN";
  return { userId: user.id, isSuperadmin, branchIds: isSuperadmin ? null : user.branches.map((b) => b.id) };
}

export async function requireSuperadmin(): Promise<AdminScope> {
  const scope = await requireAdmin();
  if (!scope.isSuperadmin) throw new Error("Unauthorized");
  return scope;
}

/** Prisma filter for a branchId column, limited to the admin's branches. */
export function branchWhere(scope: AdminScope): { in: number[] } | undefined {
  return scope.branchIds ? { in: scope.branchIds } : undefined;
}

export function canAccessBranch(scope: AdminScope, branchId: number): boolean {
  return scope.branchIds === null || scope.branchIds.includes(branchId);
}

export const NO_ACCESS: ActionResult = { ok: false, message: "Anda tidak punya akses ke cabang ini." };

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
