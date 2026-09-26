import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, inputClass } from "@/components/field";
import { updateAdmin } from "../../actions";
import { AdminFields } from "../../admin-fields";

export default async function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = await requireAdmin();
  if (!scope.isSuperadmin) notFound();

  const [user, branches] = await Promise.all([
    prisma.user.findUnique({ where: { id: Number(id) }, include: { branches: true } }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!user || user.role === "GURU") notFound();

  return (
    <ActionForm action={updateAdmin.bind(null, user.id)} className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Edit Admin</h1>
      <AdminFields user={user} branches={branches} />
      <Field label="Status">
        <select name="status" defaultValue={user.status} className={inputClass}>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif (tidak bisa login)</option>
        </select>
      </Field>
      <fieldset className="rounded border p-3">
        <legend className="px-1 text-sm font-medium">Reset password</legend>
        <Field label="Password baru (kosongkan jika tidak diganti)">
          <input name="newPassword" type="text" minLength={6} autoComplete="new-password" className={inputClass} />
        </Field>
      </fieldset>
      <div className="flex items-center gap-4">
        <SubmitButton />
        <Link href="/admin/users" className="text-sm text-gray-600 underline">
          Batal
        </Link>
      </div>
    </ActionForm>
  );
}
