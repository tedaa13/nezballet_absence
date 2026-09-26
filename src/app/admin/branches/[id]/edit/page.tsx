import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, inputClass } from "@/components/field";
import { updateBranch } from "../../actions";
import { BranchFields } from "../../branch-fields";

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const branch = await prisma.branch.findUnique({ where: { id: Number(id) } });
  if (!branch) notFound();

  return (
    <ActionForm action={updateBranch.bind(null, branch.id)} className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Edit Cabang</h1>
      <BranchFields branch={branch} />
      <Field label="Status">
        <select name="status" defaultValue={branch.status} className={inputClass}>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
        </select>
      </Field>
      <div className="flex items-center gap-4">
        <SubmitButton />
        <Link href="/admin/branches" className="text-sm text-gray-600 underline">
          Batal
        </Link>
      </div>
    </ActionForm>
  );
}
