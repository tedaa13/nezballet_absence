import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/time";
import { updateAttendance } from "./actions";

const STATUS_OPTIONS = ["HADIR", "TELAT", "IZIN", "SAKIT", "TIDAK_HADIR"];

export default async function AttendancesPage() {
  const attendances = await prisma.attendance.findMany({
    include: {
      teacher: { include: { user: true } },
      schedule: { include: { class: true, branch: true } },
    },
    orderBy: { attendanceDate: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Presensi</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Tanggal</th>
            <th>Guru</th>
            <th>Cabang / Kelas</th>
            <th>Masuk</th>
            <th>Keluar</th>
            <th>Murid</th>
            <th>Status & Catatan</th>
          </tr>
        </thead>
        <tbody>
          {attendances.map((a) => {
            const update = updateAttendance.bind(null, a.id);
            return (
              <tr key={a.id} className="border-b align-top">
                <td className="py-2">{formatDate(a.attendanceDate)}</td>
                <td>{a.teacher.user.name}</td>
                <td>
                  {a.schedule.branch.name} / {a.schedule.class.name}
                </td>
                <td>{a.checkInTime ? formatTime(a.checkInTime) : "-"}</td>
                <td>{a.checkOutTime ? formatTime(a.checkOutTime) : "-"}</td>
                <td>{a.studentCount ?? "-"}</td>
                <td>
                  <form action={update} className="flex flex-col gap-1">
                    <select name="status" defaultValue={a.status} className="rounded border px-2 py-1">
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      name="notes"
                      defaultValue={a.notes ?? ""}
                      placeholder="Catatan"
                      className="rounded border px-2 py-1"
                    />
                    <button type="submit" className="self-start text-blue-600 underline">
                      Simpan
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
