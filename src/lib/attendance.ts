import { prisma } from "@/lib/prisma";
import { evaluateCheckIn, evaluateCheckOut, isScheduleEffectiveOn } from "@/lib/schedule";
import { localDate, zonedParts } from "@/lib/time";
import type { Attendance, Class, Schedule } from "@prisma/client";

export type ScanContext =
  | { mode: "checkin"; schedule: Schedule & { class: Class }; attendance: null }
  | { mode: "checkout"; schedule: Schedule & { class: Class }; attendance: Attendance }
  | { mode: "done"; schedule: Schedule & { class: Class }; attendance: Attendance };

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
