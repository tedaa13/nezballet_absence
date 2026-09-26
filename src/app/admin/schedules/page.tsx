import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/action-form";
import { createSchedule, deleteSchedule } from "./actions";
import { DAYS, ScheduleFields } from "./schedule-fields";

export default async function SchedulesPage() {
  const [schedules, classes, teachers] = await Promise.all([
    prisma.schedule.findMany({
      include: { branch: true, class: true, teacher: { include: { user: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.class.findMany({ where: { status: "ACTIVE" }, include: { branch: true }, orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ where: { status: { not: "INACTIVE" } }, include: { user: true }, orderBy: { id: "asc" } }),
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => (
            <tr key={s.id} className="border-b align-top">
              <td className="py-2">{DAYS[s.dayOfWeek]}</td>
              <td>
                {s.startTime}–{s.endTime}
              </td>
              <td>{s.branch.name}</td>
              <td>{s.class.name}</td>
              <td>{s.teacher.user.name}</td>
              <td>{s.status === "ACTIVE" ? "Aktif" : "Nonaktif"}</td>
              <td className="py-2">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/schedules/${s.id}/edit`} className="text-blue-600 underline">
                    Edit
                  </Link>
                  <DeleteButton
                    action={deleteSchedule.bind(null, s.id)}
                    confirmMessage={`Hapus jadwal ${DAYS[s.dayOfWeek]} ${s.startTime} (${s.class.name})?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {schedules.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-gray-500">
                Belum ada jadwal.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ActionForm action={createSchedule} resetOnSuccess className="max-w-md space-y-3 border-t pt-6">
        <h2 className="font-medium">Tambah Jadwal</h2>
        <ScheduleFields classes={classes} teachers={teachers} />
        <SubmitButton />
      </ActionForm>
    </div>
  );
}
