"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { distanceInMeters } from "@/lib/geo";
import { evaluateCheckIn, evaluateCheckOut } from "@/lib/schedule";
import { localDate } from "@/lib/time";

type ActionResult = { ok: boolean; message: string };

async function requireGuru() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU" || !session.user.teacherId) {
    return null;
  }
  return { teacherId: session.user.teacherId };
}

function checkGeofence(branch: { latitude: number; longitude: number; radiusMeter: number }, lat: number, lng: number) {
  const distance = distanceInMeters(branch.latitude, branch.longitude, lat, lng);
  return { distance, withinRadius: distance <= branch.radiusMeter };
}

export async function checkInAction(
  branchId: number,
  secret: string,
  scheduleId: number,
  lat: number,
  lng: number,
): Promise<ActionResult> {
  const auth_ = await requireGuru();
  if (!auth_) return { ok: false, message: "Harus login sebagai guru." };

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch || branch.qrSecret !== secret || branch.status !== "ACTIVE") {
    return { ok: false, message: "Kode QR tidak valid." };
  }

  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.teacherId !== auth_.teacherId || schedule.branchId !== branchId) {
    return { ok: false, message: "Jadwal tidak ditemukan untuk Anda." };
  }

  const now = new Date();
  const evaluation = evaluateCheckIn(schedule, now);
  if (!evaluation.allowed) return { ok: false, message: evaluation.reason };

  const { distance, withinRadius } = checkGeofence(branch, lat, lng);
  if (!withinRadius) {
    return { ok: false, message: `Lokasi Anda terlalu jauh dari cabang (±${Math.round(distance)}m).` };
  }

  const attendanceDate = localDate(now);

  try {
    await prisma.attendance.create({
      data: {
        scheduleId,
        teacherId: auth_.teacherId,
        attendanceDate,
        checkInTime: now,
        checkInLat: lat,
        checkInLng: lng,
        distanceMeter: distance,
        status: evaluation.status,
      },
    });
  } catch {
    return { ok: false, message: "Anda sudah absen masuk untuk sesi ini." };
  }

  revalidatePath(`/scan/${branchId}/${secret}`);
  return { ok: true, message: "Absen masuk berhasil dicatat." };
}

export async function checkOutAction(
  branchId: number,
  secret: string,
  attendanceId: number,
  lat: number,
  lng: number,
  studentCount?: number,
): Promise<ActionResult> {
  const auth_ = await requireGuru();
  if (!auth_) return { ok: false, message: "Harus login sebagai guru." };

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch || branch.qrSecret !== secret) {
    return { ok: false, message: "Kode QR tidak valid." };
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { schedule: true },
  });
  if (!attendance || attendance.teacherId !== auth_.teacherId) {
    return { ok: false, message: "Data presensi tidak ditemukan." };
  }
  if (attendance.checkOutTime) return { ok: false, message: "Sudah absen keluar sebelumnya." };

  const now = new Date();
  const evaluation = evaluateCheckOut(attendance.schedule, now);
  if (!evaluation.allowed) return { ok: false, message: evaluation.reason };

  const { distance, withinRadius } = checkGeofence(branch, lat, lng);
  if (!withinRadius) {
    return { ok: false, message: `Lokasi Anda terlalu jauh dari cabang (±${Math.round(distance)}m).` };
  }

  await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      checkOutTime: now,
      checkOutLat: lat,
      checkOutLng: lng,
      studentCount: studentCount ?? null,
    },
  });

  revalidatePath(`/scan/${branchId}/${secret}`);
  return { ok: true, message: "Absen keluar berhasil dicatat." };
}
