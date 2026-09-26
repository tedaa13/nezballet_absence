"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
}

export async function createBranch(formData: FormData) {
  await requireAdmin();
  await prisma.branch.create({
    data: {
      name: String(formData.get("name")),
      address: String(formData.get("address") || ""),
      latitude: Number(formData.get("latitude")),
      longitude: Number(formData.get("longitude")),
      radiusMeter: Number(formData.get("radiusMeter") || 100),
    },
  });
  revalidatePath("/admin/branches");
}

export async function updateBranch(id: number, formData: FormData) {
  await requireAdmin();
  await prisma.branch.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      address: String(formData.get("address") || ""),
      latitude: Number(formData.get("latitude")),
      longitude: Number(formData.get("longitude")),
      radiusMeter: Number(formData.get("radiusMeter") || 100),
      status: formData.get("status") === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    },
  });
  revalidatePath("/admin/branches");
}

export async function regenerateBranchQr(id: number) {
  await requireAdmin();
  await prisma.branch.update({ where: { id }, data: { qrSecret: randomUUID() } });
  revalidatePath("/admin/branches");
  revalidatePath(`/admin/branches/${id}/qr`);
}
