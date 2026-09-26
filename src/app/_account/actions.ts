"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/admin";

const MIN_PASSWORD = 6;

/** Any logged-in user (admin or guru) changes their own password. */
export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Sesi habis, silakan login ulang." };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < MIN_PASSWORD) return { ok: false, message: `Password baru minimal ${MIN_PASSWORD} karakter.` };
  if (next !== confirm) return { ok: false, message: "Konfirmasi password tidak sama." };
  if (next === current) return { ok: false, message: "Password baru harus berbeda dari password lama." };

  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });
  if (!user || !(await bcrypt.compare(current, user.password))) {
    return { ok: false, message: "Password lama salah." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(next, 10) } });
  return { ok: true, message: "Password berhasil diganti. Gunakan password baru saat login berikutnya." };
}
