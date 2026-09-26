"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { type ActionResult, isUniqueViolation, optionalString, requireAdmin, requireSuperadmin } from "@/lib/admin";

const MIN_PASSWORD = 6;

function parseTeacher(formData: FormData) {
  const joinDate = optionalString(formData, "joinDate");
  return {
    name: String(formData.get("name")).trim(),
    email: String(formData.get("email")).trim().toLowerCase(),
    phone: optionalString(formData, "phone"),
    specialization: optionalString(formData, "specialization"),
    joinDate: joinDate ? new Date(joinDate) : null,
  };
}

export async function createTeacher(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const t = parseTeacher(formData);
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) {
    return { ok: false, message: `Password minimal ${MIN_PASSWORD} karakter.` };
  }

  try {
    await prisma.user.create({
      data: {
        name: t.name,
        email: t.email,
        password: await bcrypt.hash(password, 10),
        phone: t.phone,
        role: "GURU",
        teacher: {
          create: { phone: t.phone, specialization: t.specialization, joinDate: t.joinDate },
        },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, message: `Email ${t.email} sudah dipakai akun lain.` };
    throw error;
  }

  revalidatePath("/admin/teachers");
  return { ok: true, message: `Guru "${t.name}" ditambahkan. Login: ${t.email}` };
}

export async function updateTeacher(teacherId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const t = parseTeacher(formData);
  const status = String(formData.get("status")) as "ACTIVE" | "INACTIVE" | "CUTI";
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword && newPassword.length < MIN_PASSWORD) {
    return { ok: false, message: `Password baru minimal ${MIN_PASSWORD} karakter.` };
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return { ok: false, message: "Guru tidak ditemukan." };

  try {
    await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        name: t.name,
        email: t.email,
        phone: t.phone,
        // A teacher who is no longer active can't log in either.
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        ...(newPassword && { password: await bcrypt.hash(newPassword, 10) }),
        teacher: {
          update: { phone: t.phone, specialization: t.specialization, joinDate: t.joinDate, status },
        },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, message: `Email ${t.email} sudah dipakai akun lain.` };
    throw error;
  }

  revalidatePath("/admin/teachers");
  redirect("/admin/teachers");
}

export async function deleteTeacher(teacherId: number): Promise<ActionResult> {
  await requireSuperadmin();
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { _count: { select: { schedules: true, attendances: true } } },
  });
  if (!teacher) return { ok: false, message: "Guru tidak ditemukan." };

  const { schedules, attendances } = teacher._count;
  if (schedules > 0 || attendances > 0) {
    return {
      ok: false,
      message: `Tidak bisa dihapus: punya ${schedules} jadwal & ${attendances} riwayat presensi. Ubah status jadi Nonaktif saja.`,
    };
  }

  // Deleting the user cascades to the teacher row.
  await prisma.user.delete({ where: { id: teacher.userId } });
  revalidatePath("/admin/teachers");
  return { ok: true, message: "Guru dihapus." };
}
