"use client";

import { createContext, useActionState, useContext, useEffect, useRef, useTransition } from "react";
import type { ActionResult } from "@/lib/admin";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

const PendingContext = createContext(false);

/**
 * Form bound to a server action: shows the result message and blocks double submits while pending.
 * Submits manually (not via `<form action>`) so a failed save keeps what the user typed;
 * fields are cleared only on success when `resetOnSuccess` is set.
 */
export function ActionForm({
  action,
  children,
  className,
  confirmMessage,
  resetOnSuccess = false,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  confirmMessage?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, actionPending] = useActionState(action, null);
  const [transitionPending, startTransition] = useTransition();
  const pending = actionPending || transitionPending;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      className={className}
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      {state && !pending && (
        <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

export function SubmitButton({
  children = "Simpan",
  pendingText = "Menyimpan…",
  variant = "primary",
}: {
  children?: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "link" | "danger";
}) {
  const pending = useContext(PendingContext);
  const styles = {
    primary: "rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700",
    link: "text-blue-600 underline",
    danger: "text-red-600 underline",
  }[variant];

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-2 disabled:cursor-wait disabled:opacity-60 ${styles}`}
    >
      {pending && <Spinner />}
      {pending ? pendingText : children}
    </button>
  );
}

/** Small inline form with a confirm dialog, for delete buttons in table rows. */
export function DeleteButton({
  action,
  label = "Hapus",
  confirmMessage,
}: {
  action: Action;
  label?: string;
  confirmMessage: string;
}) {
  return (
    <ActionForm action={action} confirmMessage={confirmMessage} className="inline-flex flex-col items-end">
      <SubmitButton variant="danger" pendingText="Menghapus…">
        {label}
      </SubmitButton>
    </ActionForm>
  );
}
