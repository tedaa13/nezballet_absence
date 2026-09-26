import { Field, inputClass } from "@/components/field";
import { toDateInput } from "@/lib/admin";
import type { Branch, Class, Schedule, Teacher, User } from "@prisma/client";

export const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function ScheduleFields({
  schedule,
  classes,
  teachers,
}: {
  schedule?: Schedule;
  classes: (Class & { branch: Branch })[];
  teachers: (Teacher & { user: User })[];
}) {
  return (
    <>
      <Field label="Kelas (cabang mengikuti kelas)">
        <select name="classId" defaultValue={schedule?.classId ?? ""} required className={inputClass}>
          <option value="">Pilih kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.branch.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Guru">
        <select name="teacherId" defaultValue={schedule?.teacherId ?? ""} required className={inputClass}>
          <option value="">Pilih guru</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.user.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Hari">
        <select name="dayOfWeek" defaultValue={schedule?.dayOfWeek ?? ""} required className={inputClass}>
          <option value="">Pilih hari</option>
          {DAYS.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex gap-3">
        <Field label="Jam mulai">
          <input name="startTime" type="time" defaultValue={schedule?.startTime} required className={inputClass} />
        </Field>
        <Field label="Jam selesai">
          <input name="endTime" type="time" defaultValue={schedule?.endTime} required className={inputClass} />
        </Field>
      </div>
      <Field label="Berlaku mulai">
        <input
          name="effectiveStartDate"
          type="date"
          defaultValue={toDateInput(schedule?.effectiveStartDate)}
          required
          className={inputClass}
        />
      </Field>
      <Field label="Berlaku sampai (opsional)">
        <input
          name="effectiveEndDate"
          type="date"
          defaultValue={toDateInput(schedule?.effectiveEndDate)}
          className={inputClass}
        />
      </Field>
    </>
  );
}
