"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { type ActionResult, optionalString, requireAdmin } from "@/lib/admin";

const STATUSES = ["HADIR", "TELAT", "IZIN", "SAKIT", "TIDAK_HADIR"] as const;

export async function updateAttendance(attendanceId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const status = String(formData.get("status")) as (typeof STATUSES)[number];
  if (!STATUSES.includes(status)) return { ok: false, message: "Status tidak valid." };

  await prisma.attendance.update({
    where: { id: attendanceId },
    data: { status, notes: optionalString(formData, "notes"), verifiedBy: Number(user.id) },
  });
  revalidatePath("/admin/attendances");
  return { ok: true, message: "Tersimpan." };
}

export async function deleteAttendance(attendanceId: number): Promise<ActionResult> {
  await requireAdmin();
  await prisma.attendance.delete({ where: { id: attendanceId } });
  revalidatePath("/admin/attendances");
  return { ok: true, message: "Presensi dihapus." };
}
