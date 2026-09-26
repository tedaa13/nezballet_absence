import { localDate, utcDateOnly, zonedParts } from "@/lib/time";

export const EARLY_CHECKIN_MINUTES = 15;
export const LATE_THRESHOLD_MINUTES = 15;
export const CHECKOUT_GRACE_MINUTES = 30;

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export type Schedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  effectiveStartDate: Date;
  effectiveEndDate: Date | null;
};

/** Is this recurring schedule in effect (weekday + date range) on the given instant, in studio time? */
export function isScheduleEffectiveOn(schedule: Schedule, date: Date): boolean {
  if (schedule.dayOfWeek !== zonedParts(date).dayOfWeek) return false;
  const day = localDate(date);
  if (day < utcDateOnly(schedule.effectiveStartDate)) return false;
  if (schedule.effectiveEndDate && day > utcDateOnly(schedule.effectiveEndDate)) return false;
  return true;
}

export type CheckInEvaluation =
  | { allowed: false; reason: string }
  | { allowed: true; status: "HADIR" | "TELAT" };

/** Can a teacher check in to this schedule right now? */
export function evaluateCheckIn(schedule: Schedule, now: Date): CheckInEvaluation {
  if (!isScheduleEffectiveOn(schedule, now)) {
    return { allowed: false, reason: "Tidak ada jadwal untuk hari ini." };
  }

  const nowMinutes = zonedParts(now).minutesOfDay;
  const sessionStart = parseTimeToMinutes(schedule.startTime);
  const sessionEnd = parseTimeToMinutes(schedule.endTime);

  if (nowMinutes < sessionStart - EARLY_CHECKIN_MINUTES) {
    return { allowed: false, reason: "Belum masuk waktu absen untuk sesi ini." };
  }
  if (nowMinutes > sessionEnd) {
    return { allowed: false, reason: "Sesi ini sudah berakhir." };
  }

  const status = nowMinutes <= sessionStart + LATE_THRESHOLD_MINUTES ? "HADIR" : "TELAT";
  return { allowed: true, status };
}

export type CheckOutEvaluation = { allowed: false; reason: string } | { allowed: true };

export function evaluateCheckOut(schedule: Schedule, now: Date): CheckOutEvaluation {
  if (!isScheduleEffectiveOn(schedule, now)) {
    return { allowed: false, reason: "Tidak ada jadwal untuk hari ini." };
  }
  const nowMinutes = zonedParts(now).minutesOfDay;
  const sessionStart = parseTimeToMinutes(schedule.startTime);
  const sessionEnd = parseTimeToMinutes(schedule.endTime);

  if (nowMinutes < sessionStart) {
    return { allowed: false, reason: "Sesi belum dimulai." };
  }
  if (nowMinutes > sessionEnd + CHECKOUT_GRACE_MINUTES) {
    return { allowed: false, reason: "Waktu checkout sudah lewat." };
  }
  return { allowed: true };
}
