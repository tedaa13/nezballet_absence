"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  type ActionResult,
  NO_ACCESS,
  canAccessBranch,
  optionalNumber,
  optionalString,
  requireAdmin,
  requireSuperadmin,
} from "@/lib/admin";

function parseBranch(formData: FormData) {
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return { error: "Latitude tidak valid." };
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return { error: "Longitude tidak valid." };
  return {
    data: {
      name: String(formData.get("name")).trim(),
      address: optionalString(formData, "address"),
      latitude,
      longitude,
      radiusMeter: optionalNumber(formData, "radiusMeter") ?? 100,
    },
  };
}

export async function createBranch(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSuperadmin();
  const parsed = parseBranch(formData);
  if (parsed.error) return { ok: false, message: parsed.error };

  await prisma.branch.create({ data: parsed.data! });
  revalidatePath("/admin/branches");
  return { ok: true, message: `Cabang "${parsed.data!.name}" ditambahkan.` };
}

export async function updateBranch(id: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const scope = await requireAdmin();
  if (!canAccessBranch(scope, id)) return NO_ACCESS;
  const parsed = parseBranch(formData);
  if (parsed.error) return { ok: false, message: parsed.error };

  await prisma.branch.update({
    where: { id },
    data: { ...parsed.data!, status: formData.get("status") === "INACTIVE" ? "INACTIVE" : "ACTIVE" },
  });
  revalidatePath("/admin/branches");
  redirect("/admin/branches");
}

export async function deleteBranch(id: number): Promise<ActionResult> {
  await requireSuperadmin();
  const [classCount, scheduleCount] = await Promise.all([
    prisma.class.count({ where: { branchId: id } }),
    prisma.schedule.count({ where: { branchId: id } }),
  ]);
  if (classCount > 0 || scheduleCount > 0) {
    return {
      ok: false,
      message: `Tidak bisa dihapus: masih ada ${classCount} kelas & ${scheduleCount} jadwal. Hapus dulu, atau ubah status cabang jadi Nonaktif.`,
    };
  }

  await prisma.branch.delete({ where: { id } });
  revalidatePath("/admin/branches");
  return { ok: true, message: "Cabang dihapus." };
}

export async function regenerateBranchQr(id: number): Promise<ActionResult> {
  const scope = await requireAdmin();
  if (!canAccessBranch(scope, id)) return NO_ACCESS;
  await prisma.branch.update({ where: { id }, data: { qrSecret: randomUUID() } });
  revalidatePath("/admin/branches");
  revalidatePath(`/admin/branches/${id}/qr`);
  return { ok: true, message: "QR baru dibuat. Cetak ulang dan ganti QR lama di lokasi." };
}
