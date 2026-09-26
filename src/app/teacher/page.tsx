import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isScheduleEffectiveOn } from "@/lib/schedule";
import { formatTime, localDate, zonedParts } from "@/lib/time";

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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Jadwal Hari Ini</h1>

      {todaySchedules.length === 0 && <p>Tidak ada jadwal mengajar hari ini.</p>}

      <ul className="space-y-3">
        {todaySchedules.map((s) => {
          const attendance = attendances.find((a) => a.scheduleId === s.id);
          return (
            <li key={s.id} className="rounded border p-4">
              <div className="font-medium">
                {s.class.name} · {s.branch.name}
              </div>
              <div className="text-sm text-gray-600">
                {s.startTime}–{s.endTime}
              </div>
              <div className="mt-2 text-sm">
                {!attendance && "Belum absen — scan QR di lokasi cabang."}
                {attendance && !attendance.checkOutTime &&
                  `Sudah absen masuk (${attendance.checkInTime ? formatTime(attendance.checkInTime) : "-"}). Scan lagi saat pulang untuk absen keluar.`}
                {attendance?.checkOutTime &&
                  `Selesai — masuk ${attendance.checkInTime ? formatTime(attendance.checkInTime) : "-"}, keluar ${formatTime(attendance.checkOutTime)}.`}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
