"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getLocation } from "@/lib/geolocation";
import { directCheckIn, directCheckOut } from "./actions";

type Props =
  | { mode: "checkin"; scheduleId: number }
  | { mode: "checkout"; attendanceId: number };

export function DirectAttendance(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [studentCount, setStudentCount] = useState("");

  async function submit() {
    setBusy(true);
    setResult(null);
    try {
      const pos = await getLocation();
      const { latitude, longitude } = pos.coords;
      const res =
        props.mode === "checkin"
          ? await directCheckIn(props.scheduleId, latitude, longitude)
          : await directCheckOut(props.attendanceId, latitude, longitude, studentCount ? Number(studentCount) : undefined);
      setResult(res);
      if (res.ok) startTransition(() => router.refresh());
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Gagal mengambil lokasi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {props.mode === "checkout" && (
        <label className="block text-sm">
          Jumlah murid hadir (opsional)
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={studentCount}
            onChange={(e) => setStudentCount(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className={`inline-flex w-full items-center justify-center gap-2 rounded py-3 text-white disabled:cursor-wait disabled:opacity-60 ${
          props.mode === "checkin" ? "bg-blue-600" : "bg-green-600"
        }`}
      >
        {busy && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        )}
        {busy ? "Mengambil lokasi…" : props.mode === "checkin" ? "📍 Absen Masuk Sekarang" : "📍 Absen Keluar Sekarang"}
      </button>
      {result && <p className={`text-sm ${result.ok ? "text-green-700" : "text-red-600"}`}>{result.message}</p>}
    </div>
  );
}
