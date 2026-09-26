"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { type ActionResult, optionalNumber, optionalString, requireAdmin } from "@/lib/admin";

function parseClass(formData: FormData) {
  return {
    branchId: Number(formData.get("branchId")),
    name: String(formData.get("name")).trim(),
    level: optionalString(formData, "level"),
    capacity: optionalNumber(formData, "capacity"),
  };
}

export async function createClass(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const data = parseClass(formData);
  if (!data.branchId) return { ok: false, message: "Pilih cabang." };

  await prisma.class.create({ data });
  revalidatePath("/admin/classes");
  return { ok: true, message: `Kelas "${data.name}" ditambahkan.` };
}

export async function updateClass(classId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const data = parseClass(formData);
  if (!data.branchId) return { ok: false, message: "Pilih cabang." };

  await prisma.$transaction([
    prisma.class.update({
      where: { id: classId },
      data: { ...data, status: formData.get("status") === "INACTIVE" ? "INACTIVE" : "ACTIVE" },
    }),
    // Schedules carry their class's branch; keep them in sync if the class moved.
    prisma.schedule.updateMany({ where: { classId }, data: { branchId: data.branchId } }),
  ]);
  revalidatePath("/admin/classes");
  revalidatePath("/admin/schedules");
  redirect("/admin/classes");
}

export async function deleteClass(classId: number): Promise<ActionResult> {
  await requireAdmin();
  const scheduleCount = await prisma.schedule.count({ where: { classId } });
  if (scheduleCount > 0) {
    return {
      ok: false,
      message: `Tidak bisa dihapus: masih dipakai ${scheduleCount} jadwal. Hapus jadwalnya dulu, atau ubah status kelas jadi Nonaktif.`,
    };
  }

  await prisma.class.delete({ where: { id: classId } });
  revalidatePath("/admin/classes");
  return { ok: true, message: "Kelas dihapus." };
}
