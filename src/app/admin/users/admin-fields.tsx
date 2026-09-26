import { Field, inputClass } from "@/components/field";
import type { Branch, User } from "@prisma/client";

export function AdminFields({ user, branches }: { user?: User & { branches: Branch[] }; branches: Branch[] }) {
  const assigned = new Set(user?.branches.map((b) => b.id));

  return (
    <>
      <Field label="Nama">
        <input name="name" defaultValue={user?.name} required className={inputClass} />
      </Field>
      <Field label="Email (untuk login)">
        <input name="email" type="email" defaultValue={user?.email} required autoComplete="off" className={inputClass} />
      </Field>
      <Field label="No. HP">
        <input name="phone" defaultValue={user?.phone ?? ""} className={inputClass} />
      </Field>
      <Field label="Role">
        <select name="role" defaultValue={user?.role ?? "ADMIN"} className={inputClass}>
          <option value="ADMIN">Admin cabang — hanya cabang yang dicentang</option>
          <option value="SUPERADMIN">Superadmin — semua cabang + kelola admin</option>
        </select>
      </Field>
      <fieldset className="rounded border p-3">
        <legend className="px-1 text-sm font-medium">Cabang yang dipegang (untuk Admin cabang)</legend>
        {branches.length === 0 && <p className="text-sm text-gray-500">Belum ada cabang.</p>}
        <div className="space-y-1">
          {branches.map((b) => (
            <label key={b.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="branchIds" value={b.id} defaultChecked={assigned.has(b.id)} />
              {b.name}
              {b.status === "INACTIVE" ? " (nonaktif)" : ""}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
