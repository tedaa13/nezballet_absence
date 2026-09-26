import { Field, inputClass } from "@/components/field";
import type { Branch, Class } from "@prisma/client";

export function ClassFields({ cls, branches }: { cls?: Class; branches: Branch[] }) {
  return (
    <>
      <Field label="Cabang">
        <select name="branchId" defaultValue={cls?.branchId ?? ""} required className={inputClass}>
          <option value="">Pilih cabang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.status === "INACTIVE" ? " (nonaktif)" : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Nama kelas">
        <input name="name" defaultValue={cls?.name} required className={inputClass} />
      </Field>
      <Field label="Level">
        <input name="level" defaultValue={cls?.level ?? ""} placeholder="mis. Basic, Intermediate" className={inputClass} />
      </Field>
      <Field label="Kapasitas">
        <input name="capacity" type="number" min={1} defaultValue={cls?.capacity ?? ""} className={inputClass} />
      </Field>
    </>
  );
}
