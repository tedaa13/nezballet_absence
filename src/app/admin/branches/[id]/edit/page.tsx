import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateBranch } from "../../actions";

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const branch = await prisma.branch.findUnique({ where: { id: Number(id) } });
  if (!branch) notFound();

  const updateWithId = updateBranch.bind(null, branch.id);

  return (
    <form action={updateWithId} className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Edit Cabang</h1>
      <input name="name" defaultValue={branch.name} required className="w-full rounded border px-3 py-2" />
      <input
        name="address"
        defaultValue={branch.address ?? ""}
        className="w-full rounded border px-3 py-2"
      />
      <div className="flex gap-3">
        <input
          name="latitude"
          type="number"
          step="any"
          defaultValue={branch.latitude}
          required
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="longitude"
          type="number"
          step="any"
          defaultValue={branch.longitude}
          required
          className="w-full rounded border px-3 py-2"
        />
      </div>
      <input
        name="radiusMeter"
        type="number"
        defaultValue={branch.radiusMeter}
        className="w-full rounded border px-3 py-2"
      />
      <select name="status" defaultValue={branch.status} className="w-full rounded border px-3 py-2">
        <option value="ACTIVE">Aktif</option>
        <option value="INACTIVE">Nonaktif</option>
      </select>
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
        Simpan
      </button>
    </form>
  );
}
