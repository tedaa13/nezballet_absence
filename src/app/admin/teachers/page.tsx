import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/action-form";
import { Field, inputClass } from "@/components/field";
import { createTeacher, deleteTeacher } from "./actions";
import { TEACHER_STATUS_LABEL, TeacherFields } from "./teacher-fields";

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    include: { user: true },
    orderBy: { id: "asc" },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Guru</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Nama</th>
            <th>Email</th>
            <th>No. HP</th>
            <th>Spesialisasi</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => (
            <tr key={t.id} className="border-b align-top">
              <td className="py-2">{t.user.name}</td>
              <td>{t.user.email}</td>
              <td>{t.phone}</td>
              <td>{t.specialization}</td>
              <td>{TEACHER_STATUS_LABEL[t.status]}</td>
              <td className="py-2">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/teachers/${t.id}/edit`} className="text-blue-600 underline">
                    Edit
                  </Link>
                  <DeleteButton
                    action={deleteTeacher.bind(null, t.id)}
                    confirmMessage={`Hapus guru "${t.user.name}" beserta akun loginnya?`}
                  />
                </div>
              </td>
            </tr>
          ))}
          {teachers.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-gray-500">
                Belum ada guru.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ActionForm action={createTeacher} resetOnSuccess className="max-w-md space-y-3 border-t pt-6">
        <h2 className="font-medium">Tambah Guru</h2>
        <TeacherFields />
        <Field label="Password awal guru">
          <input name="password" type="text" required minLength={6} autoComplete="new-password" className={inputClass} />
        </Field>
        <p className="text-xs text-gray-600">
          Catat email & password ini untuk diberikan ke guru — password tidak bisa dilihat lagi setelah disimpan
          (tapi bisa di-reset lewat Edit).
        </p>
        <SubmitButton />
      </ActionForm>
    </div>
  );
}
