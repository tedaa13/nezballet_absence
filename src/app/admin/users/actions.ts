"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { type ActionResult, isUniqueViolation, optionalString, requireSuperadmin } from "@/lib/admin";

const MIN_PASSWORD = 6;

function parseAdmin(formData: FormData) {
  return {
    name: String(formData.get("name")).trim(),
    email: String(formData.get("email")).trim().toLowerCase(),
    phone: optionalString(formData, "phone"),
    role: formData.get("role") === "SUPERADMIN" ? ("SUPERADMIN" as const) : ("ADMIN" as const),
    branchIds: formData.getAll("branchIds").map(Number).filter(Boolean),
  };
}

/** Superadmins that can still log in, other than `exceptUserId`. Guards against locking everyone out. */
async function otherActiveSuperadmins(exceptUserId: number) {
  return prisma.user.count({ where: { role: "SUPERADMIN", status: "ACTIVE", id: { not: exceptUserId } } });
}

export async function createAdmin(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSuperadmin();
  const a = parseAdmin(formData);
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { ok: false, message: `Password minimal ${MIN_PASSWORD} karakter.` };
  if (a.role === "ADMIN" && a.branchIds.length === 0) return { ok: false, message: "Pilih minimal satu cabang untuk admin." };

  try {
    await prisma.user.create({
      data: {
        name: a.name,
        email: a.email,
        phone: a.phone,
        role: a.role,
        password: await bcrypt.hash(password, 10),
        branches: { connect: a.role === "ADMIN" ? a.branchIds.map((id) => ({ id })) : [] },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, message: `Email ${a.email} sudah dipakai akun lain.` };
    throw error;
  }

  revalidatePath("/admin/users");
  return { ok: true, message: `Admin "${a.name}" ditambahkan. Login: ${a.email}` };
}

export async function updateAdmin(userId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await requireSuperadmin();
  const a = parseAdmin(formData);
  const status = formData.get("status") === "INACTIVE" ? ("INACTIVE" as const) : ("ACTIVE" as const);
  const newPassword = String(formData.get("newPassword") ?? "");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role === "GURU") return { ok: false, message: "Akun admin tidak ditemukan." };
  if (newPassword && newPassword.length < MIN_PASSWORD) {
    return { ok: false, message: `Password baru minimal ${MIN_PASSWORD} karakter.` };
  }
  if (a.role === "ADMIN" && a.branchIds.length === 0) return { ok: false, message: "Pilih minimal satu cabang untuk admin." };
  if (userId === me.userId && (a.role !== "SUPERADMIN" || status !== "ACTIVE")) {
    return { ok: false, message: "Anda tidak bisa menurunkan role atau menonaktifkan akun Anda sendiri." };
  }
  const losesSuperadmin = user.role === "SUPERADMIN" && (a.role !== "SUPERADMIN" || status !== "ACTIVE");
  if (losesSuperadmin && (await otherActiveSuperadmins(userId)) === 0) {
    return { ok: false, message: "Harus ada minimal satu superadmin aktif." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: a.name,
        email: a.email,
        phone: a.phone,
        role: a.role,
        status,
        ...(newPassword && { password: await bcrypt.hash(newPassword, 10) }),
        branches: { set: a.role === "ADMIN" ? a.branchIds.map((id) => ({ id })) : [] },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, message: `Email ${a.email} sudah dipakai akun lain.` };
    throw error;
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteAdmin(userId: number): Promise<ActionResult> {
  const me = await requireSuperadmin();
  if (userId === me.userId) return { ok: false, message: "Anda tidak bisa menghapus akun Anda sendiri." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role === "GURU") return { ok: false, message: "Akun admin tidak ditemukan." };
  if (user.role === "SUPERADMIN" && (await otherActiveSuperadmins(userId)) === 0) {
    return { ok: false, message: "Harus ada minimal satu superadmin aktif." };
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  return { ok: true, message: "Akun admin dihapus." };
}
