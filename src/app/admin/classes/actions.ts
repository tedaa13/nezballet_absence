"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
}

export async function createClass(formData: FormData) {
  await requireAdmin();
  await prisma.class.create({
    data: {
      branchId: Number(formData.get("branchId")),
      name: String(formData.get("name")),
      level: String(formData.get("level") || ""),
      capacity: formData.get("capacity") ? Number(formData.get("capacity")) : null,
    },
  });
  revalidatePath("/admin/classes");
}

export async function updateClassStatus(classId: number, formData: FormData) {
  await requireAdmin();
  await prisma.class.update({
    where: { id: classId },
    data: { status: String(formData.get("status")) as "ACTIVE" | "INACTIVE" },
  });
  revalidatePath("/admin/classes");
}
