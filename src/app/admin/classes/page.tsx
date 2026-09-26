import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { branchWhere, requireAdmin } from "@/lib/admin";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/action-form";
import { createClass, deleteClass } from "./actions";
import { ClassFields } from "./class-fields";

export default async function ClassesPage() {
  const scope = await requireAdmin();
  const [classes, branches] = await Promise.all([
    prisma.class.findMany({ where: { branchId: branchWhere(scope) }, include: { branch: true }, orderBy: { id: "asc" } }),
    prisma.branch.findMany({ where: { id: branchWhere(scope), status: "ACTIVE" }, orderBy: { name: "asc" } }),
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.id} className="border-b align-top">
              <td className="py-2">{c.name}</td>
              <td>{c.branch.name}</td>
              <td>{c.level}</td>
              <td>{c.capacity ?? "-"}</td>
              <td>{c.status === "ACTIVE" ? "Aktif" : "Nonaktif"}</td>
              <td className="py-2">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/classes/${c.id}/edit`} className="text-blue-600 underline">
                    Edit
                  </Link>
                  <DeleteButton action={deleteClass.bind(null, c.id)} confirmMessage={`Hapus kelas "${c.name}"?`} />
                </div>
              </td>
            </tr>
          ))}
          {classes.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-gray-500">
                Belum ada kelas.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ActionForm action={createClass} resetOnSuccess className="max-w-md space-y-3 border-t pt-6">
        <h2 className="font-medium">Tambah Kelas</h2>
        <ClassFields branches={branches} />
        <SubmitButton />
      </ActionForm>
    </div>
  );
}
