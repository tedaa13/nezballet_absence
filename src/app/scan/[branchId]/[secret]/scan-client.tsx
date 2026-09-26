"use client";

import { useState } from "react";
import { getLocation } from "@/lib/geolocation";
import { checkInAction, checkOutAction } from "./actions";

type ScheduleInfo = { id: number; className: string; startTime: string; endTime: string };

type Props =
  | { mode: "checkin"; branchId: number; secret: string; branchName: string; schedule: ScheduleInfo }
  | { mode: "checkout"; branchId: number; secret: string; branchName: string; schedule: ScheduleInfo; attendanceId: number }
  | { mode: "done"; branchId: number; secret: string; branchName: string; schedule: ScheduleInfo }
  | { mode: "none"; branchId: number; secret: string; branchName: string };

export function ScanClient(props: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState("");

  async function handleCheckIn() {
    if (props.mode !== "checkin") return;
    setLoading(true);
    setMessage(null);
    try {
      const pos = await getLocation();
      const result = await checkInAction(
        props.branchId,
        props.secret,
        props.schedule.id,
        pos.coords.latitude,
        pos.coords.longitude,
      );
      setMessage(result.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal mengambil lokasi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut() {
    if (props.mode !== "checkout") return;
    setLoading(true);
    setMessage(null);
    try {
      const pos = await getLocation();
      const result = await checkOutAction(
        props.branchId,
        props.secret,
        props.attendanceId,
        pos.coords.latitude,
        pos.coords.longitude,
        studentCount ? Number(studentCount) : undefined,
      );
      setMessage(result.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal mengambil lokasi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-lg font-semibold">{props.branchName}</h1>

      {props.mode !== "none" && (
        <p className="text-sm text-gray-600">
          {props.schedule.className} · {props.schedule.startTime}–{props.schedule.endTime}
        </p>
      )}

      {props.mode === "none" && <p>Tidak ada jadwal untuk Anda hari ini di cabang ini.</p>}

      {props.mode === "checkin" && (
        <button
          onClick={handleCheckIn}
          disabled={loading}
          className="w-full rounded bg-blue-600 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Absen Masuk"}
        </button>
      )}

      {props.mode === "checkout" && (
        <div className="space-y-3">
          <label className="block text-sm">
            Jumlah murid hadir (opsional)
            <input
              type="number"
              min={0}
              value={studentCount}
              onChange={(e) => setStudentCount(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="w-full rounded bg-green-600 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Absen Keluar"}
          </button>
        </div>
      )}

      {props.mode === "done" && <p>Presensi hari ini sudah lengkap. Terima kasih!</p>}

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
