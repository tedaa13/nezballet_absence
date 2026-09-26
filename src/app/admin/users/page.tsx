import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/action-form";
import { Field, inputClass } from "@/components/field";
import { createAdmin, deleteAdmin } from "./actions";
import { AdminFields } from "./admin-fields";

export default async function AdminUsersPage() {
  const scope = await requireAdmin();
  if (!scope.isSuperadmin) notFound();

  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "ADMIN"] } },
      include: { branches: { orderBy: { name: "asc" } } },
      orderBy: [{ role: "desc" }, { name: "asc" }],
    }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Pengguna Admin</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Cabang</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b align-top">
              <td className="py-2">
                {u.name}
                {u.id === scope.userId && <span className="text-gray-500"> (Anda)</span>}
              </td>
              <td>{u.email}</td>
              <td>{u.role === "SUPERADMIN" ? "Superadmin" : "Admin cabang"}</td>
              <td>{u.role === "SUPERADMIN" ? "Semua" : u.branches.map((b) => b.name).join(", ") || "-"}</td>
              <td>{u.status === "ACTIVE" ? "Aktif" : "Nonaktif"}</td>
              <td className="py-2">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/users/${u.id}/edit`} className="text-blue-600 underline">
                    Edit
                  </Link>
                  {u.id !== scope.userId && (
                    <DeleteButton action={deleteAdmin.bind(null, u.id)} confirmMessage={`Hapus akun admin "${u.name}"?`} />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ActionForm action={createAdmin} resetOnSuccess className="max-w-md space-y-3 border-t pt-6">
        <h2 className="font-medium">Tambah Admin</h2>
        <AdminFields branches={branches} />
        <Field label="Password awal">
          <input name="password" type="text" required minLength={6} autoComplete="new-password" className={inputClass} />
        </Field>
        <SubmitButton />
      </ActionForm>
    </div>
  );
}
