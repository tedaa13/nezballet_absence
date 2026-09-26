import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, inputClass } from "@/components/field";
import { updateClass } from "../../actions";
import { ClassFields } from "../../class-fields";

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cls, branches] = await Promise.all([
    prisma.class.findUnique({ where: { id: Number(id) } }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!cls) notFound();

  return (
    <ActionForm action={updateClass.bind(null, cls.id)} className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Edit Kelas</h1>
      <ClassFields cls={cls} branches={branches} />
      <Field label="Status">
        <select name="status" defaultValue={cls.status} className={inputClass}>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
        </select>
      </Field>
      <div className="flex items-center gap-4">
        <SubmitButton />
        <Link href="/admin/classes" className="text-sm text-gray-600 underline">
          Batal
        </Link>
      </div>
    </ActionForm>
  );
}
