import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/time";
import { timeWithMethod } from "@/lib/labels";

export default async function TeacherHistoryPage() {
  const session = await auth();
  if (!session?.user?.teacherId) redirect("/login");

  const attendances = await prisma.attendance.findMany({
    where: { teacherId: session.user.teacherId },
    include: { schedule: { include: { class: true, branch: true } } },
    orderBy: { attendanceDate: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Riwayat Presensi</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Tanggal</th>
            <th>Kelas / Cabang</th>
            <th>Masuk</th>
            <th>Keluar</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendances.map((a) => (
            <tr key={a.id} className="border-b">
              <td className="py-2">{formatDate(a.attendanceDate)}</td>
              <td>
                {a.schedule.class.name} / {a.schedule.branch.name}
              </td>
              <td>{a.checkInTime ? timeWithMethod(formatTime(a.checkInTime), a.checkInMethod) : "-"}</td>
              <td>{a.checkOutTime ? timeWithMethod(formatTime(a.checkOutTime), a.checkOutMethod) : "-"}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
