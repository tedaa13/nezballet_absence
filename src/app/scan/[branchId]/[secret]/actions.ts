"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type AttendanceResult, performCheckIn, performCheckOut } from "@/lib/attendance";

async function requireGuru() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU" || !session.user.teacherId) {
    return null;
  }
  return { teacherId: session.user.teacherId };
}

async function isValidQr(branchId: number, secret: string) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  return !!branch && branch.qrSecret === secret && branch.status === "ACTIVE";
}

export async function checkInAction(
  branchId: number,
  secret: string,
  scheduleId: number,
  lat: number,
  lng: number,
): Promise<AttendanceResult> {
  const guru = await requireGuru();
  if (!guru) return { ok: false, message: "Harus login sebagai guru." };
  if (!(await isValidQr(branchId, secret))) return { ok: false, message: "Kode QR tidak valid." };

  const result = await performCheckIn({ teacherId: guru.teacherId, scheduleId, lat, lng, method: "QR", branchId });
  if (result.ok) revalidatePath(`/scan/${branchId}/${secret}`);
  return result;
}

export async function checkOutAction(
  branchId: number,
  secret: string,
  attendanceId: number,
  lat: number,
  lng: number,
  studentCount?: number,
): Promise<AttendanceResult> {
  const guru = await requireGuru();
  if (!guru) return { ok: false, message: "Harus login sebagai guru." };
  if (!(await isValidQr(branchId, secret))) return { ok: false, message: "Kode QR tidak valid." };

  const result = await performCheckOut({
    teacherId: guru.teacherId,
    attendanceId,
    lat,
    lng,
    studentCount,
    method: "QR",
    branchId,
  });
  if (result.ok) revalidatePath(`/scan/${branchId}/${secret}`);
  return result;
}
