"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
}

export async function createTeacher(formData: FormData) {
  await requireAdmin();
  const password = String(formData.get("password"));
  const hashed = await bcrypt.hash(password, 10);
  const joinDateRaw = String(formData.get("joinDate") || "");

  await prisma.user.create({
    data: {
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: hashed,
      phone: String(formData.get("phone") || ""),
      role: "GURU",
      teacher: {
        create: {
          phone: String(formData.get("phone") || ""),
          specialization: String(formData.get("specialization") || ""),
          joinDate: joinDateRaw ? new Date(joinDateRaw) : null,
        },
      },
    },
  });
  revalidatePath("/admin/teachers");
}

export async function updateTeacherStatus(teacherId: number, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status"));
  await prisma.teacher.update({
    where: { id: teacherId },
    data: { status: status as "ACTIVE" | "INACTIVE" | "CUTI" },
  });
  revalidatePath("/admin/teachers");
}
