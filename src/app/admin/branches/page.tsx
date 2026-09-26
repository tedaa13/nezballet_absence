import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { branchWhere, requireAdmin } from "@/lib/admin";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/action-form";
import { createBranch, deleteBranch } from "./actions";
import { BranchFields } from "./branch-fields";

export default async function BranchesPage() {
  const scope = await requireAdmin();
  const branches = await prisma.branch.findMany({ where: { id: branchWhere(scope) }, orderBy: { id: "asc" } });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Cabang</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Nama</th>
            <th>Alamat</th>
            <th>Radius (m)</th>
            <th>Absen</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b) => (
            <tr key={b.id} className="border-b align-top">
              <td className="py-2">{b.name}</td>
              <td>{b.address}</td>
              <td>{b.radiusMeter}</td>
              <td>{b.allowDirectCheckin ? "QR / Langsung" : "Wajib QR"}</td>
              <td>{b.status === "ACTIVE" ? "Aktif" : "Nonaktif"}</td>
              <td className="py-2">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/branches/${b.id}/edit`} className="text-blue-600 underline">
                    Edit
                  </Link>
                  <Link href={`/admin/branches/${b.id}/qr`} className="text-blue-600 underline">
                    QR
                  </Link>
                  {scope.isSuperadmin && (
                    <DeleteButton
                      action={deleteBranch.bind(null, b.id)}
                      confirmMessage={`Hapus cabang "${b.name}"?`}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
          {branches.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-gray-500">
                {scope.isSuperadmin ? "Belum ada cabang." : "Anda belum ditugaskan ke cabang mana pun. Hubungi superadmin."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {scope.isSuperadmin && (
        <ActionForm action={createBranch} resetOnSuccess className="max-w-md space-y-3 border-t pt-6">
          <h2 className="font-medium">Tambah Cabang</h2>
          <BranchFields />
          <SubmitButton />
        </ActionForm>
      )}
    </div>
  );
}
