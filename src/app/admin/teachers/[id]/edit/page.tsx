import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, inputClass } from "@/components/field";
import { updateTeacher } from "../../actions";
import { TeacherFields } from "../../teacher-fields";

export default async function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({ where: { id: Number(id) }, include: { user: true } });
  if (!teacher) notFound();

  return (
    <ActionForm action={updateTeacher.bind(null, teacher.id)} className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Edit Guru</h1>
      <TeacherFields teacher={teacher} />
      <Field label="Status">
        <select name="status" defaultValue={teacher.status} className={inputClass}>
          <option value="ACTIVE">Aktif</option>
          <option value="CUTI">Cuti</option>
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
        <Link href="/admin/teachers" className="text-sm text-gray-600 underline">
          Batal
        </Link>
      </div>
    </ActionForm>
  );
}
