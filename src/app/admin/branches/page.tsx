import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createBranch } from "./actions";

export default async function BranchesPage() {
  const branches = await prisma.branch.findMany({ orderBy: { id: "asc" } });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Cabang</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Nama</th>
            <th>Alamat</th>
            <th>Radius (m)</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b) => (
            <tr key={b.id} className="border-b">
              <td className="py-2">{b.name}</td>
              <td>{b.address}</td>
              <td>{b.radiusMeter}</td>
              <td>{b.status}</td>
              <td className="space-x-3 text-right">
                <Link href={`/admin/branches/${b.id}/edit`} className="text-blue-600 underline">
                  Edit
                </Link>
                <Link href={`/admin/branches/${b.id}/qr`} className="text-blue-600 underline">
                  QR
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action={createBranch} className="max-w-md space-y-3 border-t pt-6">
        <h2 className="font-medium">Tambah Cabang</h2>
        <input name="name" placeholder="Nama cabang" required className="w-full rounded border px-3 py-2" />
        <input name="address" placeholder="Alamat" className="w-full rounded border px-3 py-2" />
        <div className="flex gap-3">
          <input
            name="latitude"
            type="number"
            step="any"
            placeholder="Latitude"
            required
            className="w-full rounded border px-3 py-2"
          />
          <input
            name="longitude"
            type="number"
            step="any"
            placeholder="Longitude"
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <input
          name="radiusMeter"
          type="number"
          placeholder="Radius toleransi (meter), default 100"
          className="w-full rounded border px-3 py-2"
        />
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Simpan
        </button>
      </form>
    </div>
  );
}
