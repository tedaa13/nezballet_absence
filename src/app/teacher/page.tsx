import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CHECKOUT_GRACE_MINUTES,
  EARLY_CHECKIN_MINUTES,
  evaluateCheckIn,
  evaluateCheckOut,
  isScheduleEffectiveOn,
  parseTimeToMinutes,
} from "@/lib/schedule";
import { formatTime, localDate, zonedParts } from "@/lib/time";
import { DirectAttendance } from "./direct-attendance";
import type { Attendance, Branch, Class, Schedule } from "@prisma/client";

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

const METHOD_LABEL = { QR: "scan QR", DIRECT: "langsung" } as const;

function ScheduleStatus({
  schedule,
  attendance,
  now,
}: {
  schedule: Schedule & { branch: Branch; class: Class };
  attendance?: Attendance;
  now: Date;
}) {
  const nowMinutes = zonedParts(now).minutesOfDay;
  const start = parseTimeToMinutes(schedule.startTime);
  const end = parseTimeToMinutes(schedule.endTime);
  const direct = schedule.branch.allowDirectCheckin;

  if (attendance?.checkOutTime) {
    return (
      <p className="mt-2 text-sm text-green-700">
        ✅ Selesai — masuk {attendance.checkInTime ? formatTime(attendance.checkInTime) : "-"}, keluar{" "}
        {formatTime(attendance.checkOutTime)}.
      </p>
    );
  }

  if (attendance) {
    const checkedIn = `Sudah absen masuk ${attendance.checkInTime ? formatTime(attendance.checkInTime) : ""}${
      attendance.checkInMethod ? ` (${METHOD_LABEL[attendance.checkInMethod]})` : ""
    }${attendance.status === "TELAT" ? " — TELAT" : ""}.`;

    if (evaluateCheckOut(schedule, now).allowed) {
      return (
        <div className="mt-2 text-sm">
          <p>{checkedIn}</p>
          {direct ? <DirectAttendance mode="checkout" attendanceId={attendance.id} /> : <p>Scan QR di lokasi untuk absen keluar.</p>}
        </div>
      );
    }
    return (
      <p className="mt-2 text-sm">
        {checkedIn}{" "}
        {nowMinutes < start
          ? `Absen keluar bisa mulai ${schedule.startTime}.`
          : `Batas absen keluar (${minutesToTime(end + CHECKOUT_GRACE_MINUTES)}) sudah lewat.`}
      </p>
    );
  }

  if (evaluateCheckIn(schedule, now).allowed) {
    return direct ? (
      <DirectAttendance mode="checkin" scheduleId={schedule.id} />
    ) : (
      <p className="mt-2 text-sm">Belum absen — cabang ini mewajibkan scan QR di lokasi.</p>
    );
  }

  return (
    <p className="mt-2 text-sm text-gray-600">
      {nowMinutes < start - EARLY_CHECKIN_MINUTES
        ? `Absen dibuka mulai ${minutesToTime(start - EARLY_CHECKIN_MINUTES)}. Buka lagi halaman ini saat sudah di lokasi.`
        : "❌ Sesi sudah berakhir tanpa absen."}
    </p>
  );
}

export default async function TeacherHomePage() {
  const session = await auth();
  if (!session?.user?.teacherId) redirect("/login");

  const now = new Date();
  const todayStart = localDate(now);

  const schedules = await prisma.schedule.findMany({
    where: { teacherId: session.user.teacherId, dayOfWeek: zonedParts(now).dayOfWeek, status: "ACTIVE" },
    include: { class: true, branch: true },
    orderBy: { startTime: "asc" },
  });

  const todaySchedules = schedules.filter((s) => isScheduleEffectiveOn(s, now));

  const attendances = await prisma.attendance.findMany({
    where: {
      teacherId: session.user.teacherId,
      attendanceDate: todayStart,
      scheduleId: { in: todaySchedules.map((s) => s.id) },
    },
  });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Jadwal Hari Ini</h1>

      {todaySchedules.length === 0 && <p>Tidak ada jadwal mengajar hari ini.</p>}

      <ul className="space-y-3">
        {todaySchedules.map((s) => (
          <li key={s.id} className="rounded border p-4">
            <div className="font-medium">
              {s.class.name} · {s.branch.name}
            </div>
            <div className="text-sm text-gray-600">
              {s.startTime}–{s.endTime}
            </div>
            <ScheduleStatus schedule={s} attendance={attendances.find((a) => a.scheduleId === s.id)} now={now} />
          </li>
        ))}
      </ul>

      {todaySchedules.length > 0 && (
        <p className="text-xs text-gray-500">
          Absen bisa lewat tombol di atas (lokasi HP harus dekat cabang) atau scan QR yang ditempel di cabang.
        </p>
      )}
    </div>
  );
}
