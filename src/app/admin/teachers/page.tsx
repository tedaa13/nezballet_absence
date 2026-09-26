import { prisma } from "@/lib/prisma";
import { createTeacher, updateTeacherStatus } from "./actions";

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    include: { user: true },
    orderBy: { id: "asc" },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Guru</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Nama</th>
            <th>Email</th>
            <th>Spesialisasi</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => {
            const updateStatus = updateTeacherStatus.bind(null, t.id);
            return (
              <tr key={t.id} className="border-b">
                <td className="py-2">{t.user.name}</td>
                <td>{t.user.email}</td>
                <td>{t.specialization}</td>
                <td>
                  <form action={updateStatus} className="flex items-center gap-2">
                    <select
                      name="status"
                      defaultValue={t.status}
                      className="rounded border px-2 py-1"
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="CUTI">Cuti</option>
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

      <form action={createTeacher} autoComplete="off" className="max-w-md space-y-3 border-t pt-6">
        <h2 className="font-medium">Tambah Guru</h2>
        <label className="block text-sm">
          Nama
          <input name="name" required autoComplete="off" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Email (untuk login guru)
          <input name="email" type="email" required autoComplete="off" placeholder="mis. sinta@nezballet.id" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Password awal guru
          <input name="password" type="text" required minLength={6} autoComplete="new-password" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <p className="text-xs text-gray-600">Catat email & password ini untuk diberikan ke guru — password tidak bisa dilihat lagi setelah disimpan.</p>
        <label className="block text-sm">
          No. HP
          <input name="phone" autoComplete="off" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Spesialisasi
          <input name="specialization" placeholder="mis. Ballet Basic" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Tanggal bergabung
          <input name="joinDate" type="date" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Simpan
        </button>
      </form>
    </div>
  );
}
