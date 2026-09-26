import { prisma } from "@/lib/prisma";
import { createClass, updateClassStatus } from "./actions";

export default async function ClassesPage() {
  const [classes, branches] = await Promise.all([
    prisma.class.findMany({ include: { branch: true }, orderBy: { id: "asc" } }),
    prisma.branch.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Kelas</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Nama</th>
            <th>Cabang</th>
            <th>Level</th>
            <th>Kapasitas</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => {
            const updateStatus = updateClassStatus.bind(null, c.id);
            return (
              <tr key={c.id} className="border-b">
                <td className="py-2">{c.name}</td>
                <td>{c.branch.name}</td>
                <td>{c.level}</td>
                <td>{c.capacity ?? "-"}</td>
                <td>
                  <form action={updateStatus} className="flex items-center gap-2">
                    <select
                      name="status"
                      defaultValue={c.status}
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

      <form action={createClass} className="max-w-md space-y-3 border-t pt-6">
        <h2 className="font-medium">Tambah Kelas</h2>
        <select name="branchId" required className="w-full rounded border px-3 py-2">
          <option value="">Pilih cabang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input name="name" placeholder="Nama kelas" required className="w-full rounded border px-3 py-2" />
        <input name="level" placeholder="Level (mis. Basic, Intermediate)" className="w-full rounded border px-3 py-2" />
        <input name="capacity" type="number" placeholder="Kapasitas" className="w-full rounded border px-3 py-2" />
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Simpan
        </button>
      </form>
    </div>
  );
}
