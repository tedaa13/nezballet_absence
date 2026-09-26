"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { type ActionResult, NO_ACCESS, canAccessBranch, optionalString, requireAdmin } from "@/lib/admin";

async function parseSchedule(formData: FormData) {
  const classId = Number(formData.get("classId"));
  const teacherId = Number(formData.get("teacherId"));
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = String(formData.get("startTime"));
  const endTime = String(formData.get("endTime"));
  const start = optionalString(formData, "effectiveStartDate");
  const end = optionalString(formData, "effectiveEndDate");

  if (!classId || !teacherId) return { error: "Pilih kelas dan guru." };
  if (!(dayOfWeek >= 0 && dayOfWeek <= 6)) return { error: "Pilih hari." };
  if (!startTime || !endTime || endTime <= startTime) return { error: "Jam selesai harus setelah jam mulai." };
  if (!start) return { error: "Isi tanggal mulai berlaku." };
  if (end && end < start) return { error: "Tanggal akhir harus setelah tanggal mulai." };

  // The branch always follows the class, so the two can never disagree.
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return { error: "Kelas tidak ditemukan." };

  return {
    data: {
      branchId: cls.branchId,
      classId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      effectiveStartDate: new Date(start),
      effectiveEndDate: end ? new Date(end) : null,
    },
  };
}

export async function createSchedule(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const scope = await requireAdmin();
  const parsed = await parseSchedule(formData);
  if (parsed.error) return { ok: false, message: parsed.error };
  if (!canAccessBranch(scope, parsed.data!.branchId)) return NO_ACCESS;

  await prisma.schedule.create({ data: parsed.data! });
  revalidatePath("/admin/schedules");
  return { ok: true, message: "Jadwal ditambahkan." };
}

export async function updateSchedule(scheduleId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const scope = await requireAdmin();
  const parsed = await parseSchedule(formData);
  if (parsed.error) return { ok: false, message: parsed.error };
  const existing = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!existing || !canAccessBranch(scope, existing.branchId) || !canAccessBranch(scope, parsed.data!.branchId)) {
    return NO_ACCESS;
  }

  await prisma.schedule.update({
    where: { id: scheduleId },
    data: { ...parsed.data!, status: formData.get("status") === "INACTIVE" ? "INACTIVE" : "ACTIVE" },
  });
  revalidatePath("/admin/schedules");
  redirect("/admin/schedules");
}

export async function deleteSchedule(scheduleId: number): Promise<ActionResult> {
  const scope = await requireAdmin();
  const existing = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!existing || !canAccessBranch(scope, existing.branchId)) return NO_ACCESS;
  const attendanceCount = await prisma.attendance.count({ where: { scheduleId } });
  if (attendanceCount > 0) {
    return {
      ok: false,
      message: `Tidak bisa dihapus: sudah ada ${attendanceCount} data presensi. Ubah status jadi Nonaktif, atau isi "Berlaku sampai".`,
    };
  }

  await prisma.schedule.delete({ where: { id: scheduleId } });
  revalidatePath("/admin/schedules");
  return { ok: true, message: "Jadwal dihapus." };
}
