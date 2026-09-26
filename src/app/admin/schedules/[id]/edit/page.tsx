import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, inputClass } from "@/components/field";
import { updateSchedule } from "../../actions";
import { ScheduleFields } from "../../schedule-fields";

export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [schedule, classes, teachers] = await Promise.all([
    prisma.schedule.findUnique({ where: { id: Number(id) } }),
    prisma.class.findMany({ include: { branch: true }, orderBy: { name: "asc" } }),
    prisma.teacher.findMany({ include: { user: true }, orderBy: { id: "asc" } }),
  ]);
  if (!schedule) notFound();

  return (
    <ActionForm action={updateSchedule.bind(null, schedule.id)} className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Edit Jadwal</h1>
      <ScheduleFields schedule={schedule} classes={classes} teachers={teachers} />
      <Field label="Status">
        <select name="status" defaultValue={schedule.status} className={inputClass}>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
        </select>
      </Field>
      <div className="flex items-center gap-4">
        <SubmitButton />
        <Link href="/admin/schedules" className="text-sm text-gray-600 underline">
          Batal
        </Link>
      </div>
    </ActionForm>
  );
}
