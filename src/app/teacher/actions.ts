"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { type AttendanceResult, performCheckIn, performCheckOut } from "@/lib/attendance";

async function requireTeacherId() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU" || !session.user.teacherId) return null;
  return session.user.teacherId;
}

/** Check in straight from the schedule page (no QR). Geofence and schedule window still apply. */
export async function directCheckIn(scheduleId: number, lat: number, lng: number): Promise<AttendanceResult> {
  const teacherId = await requireTeacherId();
  if (!teacherId) return { ok: false, message: "Harus login sebagai guru." };

  const result = await performCheckIn({ teacherId, scheduleId, lat, lng, method: "DIRECT" });
  if (result.ok) revalidatePath("/teacher");
  return result;
}

export async function directCheckOut(
  attendanceId: number,
  lat: number,
  lng: number,
  studentCount?: number,
): Promise<AttendanceResult> {
  const teacherId = await requireTeacherId();
  if (!teacherId) return { ok: false, message: "Harus login sebagai guru." };

  const result = await performCheckOut({ teacherId, attendanceId, lat, lng, studentCount, method: "DIRECT" });
  if (result.ok) revalidatePath("/teacher");
  return result;
}
