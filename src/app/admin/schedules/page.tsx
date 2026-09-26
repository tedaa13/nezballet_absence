import { prisma } from "@/lib/prisma";
import { createSchedule, updateScheduleStatus } from "./actions";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default async function SchedulesPage() {
  const [schedules, branches, classes, teachers] = await Promise.all([
    prisma.schedule.findMany({
      include: { branch: true, class: true, teacher: { include: { user: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.branch.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ include: { branch: true }, orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ include: { user: true }, orderBy: { id: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Jadwal</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Hari</th>
            <th>Jam</th>
            <th>Cabang</th>
            <th>Kelas</th>
            <th>Guru</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => {
            const updateStatus = updateScheduleStatus.bind(null, s.id);
            return (
              <tr key={s.id} className="border-b">
                <td className="py-2">{DAYS[s.dayOfWeek]}</td>
                <td>
                  {s.startTime}–{s.endTime}
                </td>
                <td>{s.branch.name}</td>
                <td>{s.class.name}</td>
                <td>{s.teacher.user.name}</td>
                <td>
                  <form action={updateStatus} className="flex items-center gap-2">
                    <select
                      name="status"
                      defaultValue={s.status}
                      className="rounded border px-2 py-1"
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="INACTIVE">Nonaktif</option>
                    </select>
                    <button type="submit" className="text-blue-600 underline">
                      Simpan
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <form action={createSchedule} className="max-w-md space-y-3 border-t pt-6">
        <h2 className="font-medium">Tambah Jadwal</h2>
        <select name="branchId" required className="w-full rounded border px-3 py-2">
          <option value="">Pilih cabang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select name="classId" required className="w-full rounded border px-3 py-2">
          <option value="">Pilih kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.branch.name})
            </option>
          ))}
        </select>
        <select name="teacherId" required className="w-full rounded border px-3 py-2">
          <option value="">Pilih guru</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.user.name}
            </option>
          ))}
        </select>
        <select name="dayOfWeek" required className="w-full rounded border px-3 py-2">
          <option value="">Pilih hari</option>
          {DAYS.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <input name="startTime" type="time" required className="w-full rounded border px-3 py-2" />
          <input name="endTime" type="time" required className="w-full rounded border px-3 py-2" />
        </div>
        <label className="block text-sm">
          Berlaku mulai
          <input
            name="effectiveStartDate"
            type="date"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Berlaku sampai (opsional)
          <input name="effectiveEndDate" type="date" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Simpan
        </button>
      </form>
    </div>
  );
}
