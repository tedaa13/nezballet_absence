import { prisma } from "@/lib/prisma";
import { distanceInMeters } from "@/lib/geo";
import { evaluateCheckIn, evaluateCheckOut, isScheduleEffectiveOn } from "@/lib/schedule";
import { localDate, zonedParts } from "@/lib/time";
import type { Attendance, AttendanceMethod, Branch, Class, Schedule } from "@prisma/client";

export type ScanContext =
  | { mode: "checkin"; schedule: Schedule & { class: Class }; attendance: null }
  | { mode: "checkout"; schedule: Schedule & { class: Class }; attendance: Attendance }
  | { mode: "done"; schedule: Schedule & { class: Class }; attendance: Attendance };

export type AttendanceResult = { ok: boolean; message: string };

/** Finds the one schedule (if any) a teacher can act on right now at this branch. */
export async function resolveScanContext(
  teacherId: number,
  branchId: number,
  now: Date,
): Promise<ScanContext | null> {
  const schedules = await prisma.schedule.findMany({
    where: { teacherId, branchId, status: "ACTIVE", dayOfWeek: zonedParts(now).dayOfWeek },
    include: { class: true },
  });

  const attendanceDate = localDate(now);

  for (const schedule of schedules) {
    if (!isScheduleEffectiveOn(schedule, now)) continue;

    const attendance = await prisma.attendance.findUnique({
      where: { scheduleId_attendanceDate: { scheduleId: schedule.id, attendanceDate } },
    });

    if (!attendance) {
      if (evaluateCheckIn(schedule, now).allowed) {
        return { mode: "checkin", schedule, attendance: null };
      }
      continue;
    }

    if (!attendance.checkOutTime) {
      if (evaluateCheckOut(schedule, now).allowed) {
        return { mode: "checkout", schedule, attendance };
      }
      return { mode: "done", schedule, attendance };
    }

    return { mode: "done", schedule, attendance };
  }

  return null;
}

function checkGeofence(branch: Branch, lat: number, lng: number): AttendanceResult | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, message: "Lokasi tidak valid." };
  const distance = distanceInMeters(branch.latitude, branch.longitude, lat, lng);
  if (distance > branch.radiusMeter) {
    return {
      ok: false,
      message: `Lokasi Anda terlalu jauh dari ${branch.name} (±${Math.round(distance)} m, maksimal ${branch.radiusMeter} m).`,
    };
  }
  return null;
}

/**
 * Check-in shared by the QR scan and the direct (schedule page) flow.
 * Callers verify how the teacher got here (QR secret, or the branch allowing direct check-in);
 * this verifies ownership, schedule window and geofence against the schedule's own branch.
 */
export async function performCheckIn(opts: {
  teacherId: number;
  scheduleId: number;
  lat: number;
  lng: number;
  method: AttendanceMethod;
  /** When set (QR flow), the schedule must belong to this branch. */
  branchId?: number;
}): Promise<AttendanceResult> {
  const schedule = await prisma.schedule.findUnique({ where: { id: opts.scheduleId }, include: { branch: true } });
  if (!schedule || schedule.teacherId !== opts.teacherId || schedule.status !== "ACTIVE") {
    return { ok: false, message: "Jadwal tidak ditemukan untuk Anda." };
  }
  if (opts.branchId !== undefined && schedule.branchId !== opts.branchId) {
    return { ok: false, message: "Jadwal ini bukan di cabang QR yang Anda scan." };
  }
  if (schedule.branch.status !== "ACTIVE") return { ok: false, message: "Cabang sedang nonaktif." };
  if (opts.method === "DIRECT" && !schedule.branch.allowDirectCheckin) {
    return { ok: false, message: "Cabang ini mewajibkan scan QR untuk absen." };
  }

  const now = new Date();
  const evaluation = evaluateCheckIn(schedule, now);
  if (!evaluation.allowed) return { ok: false, message: evaluation.reason };

  const geofenceError = checkGeofence(schedule.branch, opts.lat, opts.lng);
  if (geofenceError) return geofenceError;

  try {
    await prisma.attendance.create({
      data: {
        scheduleId: schedule.id,
        teacherId: opts.teacherId,
        attendanceDate: localDate(now),
        checkInTime: now,
        checkInLat: opts.lat,
        checkInLng: opts.lng,
        checkInMethod: opts.method,
        distanceMeter: distanceInMeters(schedule.branch.latitude, schedule.branch.longitude, opts.lat, opts.lng),
        status: evaluation.status,
      },
    });
  } catch {
    return { ok: false, message: "Anda sudah absen masuk untuk sesi ini." };
  }

  return {
    ok: true,
    message: evaluation.status === "TELAT" ? "Absen masuk tercatat (TELAT)." : "Absen masuk berhasil dicatat.",
  };
}

export async function performCheckOut(opts: {
  teacherId: number;
  attendanceId: number;
  lat: number;
  lng: number;
  method: AttendanceMethod;
  studentCount?: number;
  branchId?: number;
}): Promise<AttendanceResult> {
  const attendance = await prisma.attendance.findUnique({
    where: { id: opts.attendanceId },
    include: { schedule: { include: { branch: true } } },
  });
  if (!attendance || attendance.teacherId !== opts.teacherId) {
    return { ok: false, message: "Data presensi tidak ditemukan." };
  }
  const { branch } = attendance.schedule;
  if (opts.branchId !== undefined && attendance.schedule.branchId !== opts.branchId) {
    return { ok: false, message: "Jadwal ini bukan di cabang QR yang Anda scan." };
  }
  if (opts.method === "DIRECT" && !branch.allowDirectCheckin) {
    return { ok: false, message: "Cabang ini mewajibkan scan QR untuk absen." };
  }
  if (attendance.checkOutTime) return { ok: false, message: "Sudah absen keluar sebelumnya." };

  const now = new Date();
  const evaluation = evaluateCheckOut(attendance.schedule, now);
  if (!evaluation.allowed) return { ok: false, message: evaluation.reason };

  const geofenceError = checkGeofence(branch, opts.lat, opts.lng);
  if (geofenceError) return geofenceError;

  const studentCount =
    opts.studentCount !== undefined && Number.isInteger(opts.studentCount) && opts.studentCount >= 0
      ? opts.studentCount
      : null;

  await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutTime: now,
      checkOutLat: opts.lat,
      checkOutLng: opts.lng,
      checkOutMethod: opts.method,
      studentCount,
    },
  });

  return { ok: true, message: "Absen keluar berhasil dicatat." };
}
