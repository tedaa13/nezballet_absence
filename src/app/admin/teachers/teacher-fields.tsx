import { Field, inputClass } from "@/components/field";
import { toDateInput } from "@/lib/admin";
import type { Teacher, User } from "@prisma/client";

export const TEACHER_STATUS_LABEL = { ACTIVE: "Aktif", CUTI: "Cuti", INACTIVE: "Nonaktif" } as const;

export function TeacherFields({ teacher }: { teacher?: Teacher & { user: User } }) {
  return (
    <>
      <Field label="Nama">
        <input name="name" defaultValue={teacher?.user.name} required className={inputClass} />
      </Field>
      <Field label="Email (untuk login guru)">
        <input
          name="email"
          type="email"
          defaultValue={teacher?.user.email}
          required
          autoComplete="off"
          placeholder="mis. sinta@nezballet.id"
          className={inputClass}
        />
      </Field>
      <Field label="No. HP">
        <input name="phone" defaultValue={teacher?.phone ?? ""} className={inputClass} />
      </Field>
      <Field label="Spesialisasi">
        <input
          name="specialization"
          defaultValue={teacher?.specialization ?? ""}
          placeholder="mis. Ballet Basic"
          className={inputClass}
        />
      </Field>
      <Field label="Tanggal bergabung">
        <input name="joinDate" type="date" defaultValue={toDateInput(teacher?.joinDate)} className={inputClass} />
      </Field>
    </>
  );
}
