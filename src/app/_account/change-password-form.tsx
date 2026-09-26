import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, inputClass } from "@/components/field";
import { changePassword } from "./actions";

export function ChangePasswordForm({ name, email }: { name?: string | null; email?: string | null }) {
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Akun Saya</h1>
      <p className="text-sm text-gray-600">
        {name} · {email}
      </p>
      <ActionForm action={changePassword} resetOnSuccess className="space-y-3">
        <h2 className="font-medium">Ganti Password</h2>
        <Field label="Password lama">
          <input name="currentPassword" type="password" required autoComplete="current-password" className={inputClass} />
        </Field>
        <Field label="Password baru (min. 6 karakter)">
          <input name="newPassword" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
        </Field>
        <Field label="Ulangi password baru">
          <input name="confirmPassword" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
        </Field>
        <SubmitButton>Ganti Password</SubmitButton>
      </ActionForm>
    </div>
  );
}
