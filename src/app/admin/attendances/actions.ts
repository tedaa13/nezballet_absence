"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  type ActionResult,
  type AdminScope,
  NO_ACCESS,
  canAccessBranch,
  optionalString,
  requireAdmin,
} from "@/lib/admin";

const STATUSES = ["HADIR", "TELAT", "IZIN", "SAKIT", "TIDAK_HADIR"] as const;

async function canAccessAttendance(scope: AdminScope, attendanceId: number) {
  const attendance = await prisma.attendance.findUnique({ where: { id: attendanceId }, include: { schedule: true } });
  return !!attendance && canAccessBranch(scope, attendance.schedule.branchId);
}

export async function updateAttendance(attendanceId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const scope = await requireAdmin();
  if (!(await canAccessAttendance(scope, attendanceId))) return NO_ACCESS;
  const status = String(formData.get("status")) as (typeof STATUSES)[number];
  if (!STATUSES.includes(status)) return { ok: false, message: "Status tidak valid." };

  await prisma.attendance.update({
    where: { id: attendanceId },
    data: { status, notes: optionalString(formData, "notes"), verifiedBy: scope.userId },
  });
  revalidatePath("/admin/attendances");
  return { ok: true, message: "Tersimpan." };
}

export async function deleteAttendance(attendanceId: number): Promise<ActionResult> {
  const scope = await requireAdmin();
  if (!(await canAccessAttendance(scope, attendanceId))) return NO_ACCESS;
  await prisma.attendance.delete({ where: { id: attendanceId } });
  revalidatePath("/admin/attendances");
  return { ok: true, message: "Presensi dihapus." };
}
