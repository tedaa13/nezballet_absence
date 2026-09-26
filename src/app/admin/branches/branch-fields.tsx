"use client";

import { useRef, useState } from "react";
import { Field, inputClass } from "@/components/field";
import type { Branch } from "@prisma/client";

export function BranchFields({ branch }: { branch?: Branch }) {
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function fillCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError("Browser tidak mendukung GPS.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (latRef.current) latRef.current.value = pos.coords.latitude.toFixed(6);
        if (lngRef.current) lngRef.current.value = pos.coords.longitude.toFixed(6);
        setLocating(false);
      },
      () => {
        setGeoError("Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <>
      <Field label="Nama cabang">
        <input name="name" defaultValue={branch?.name} required className={inputClass} />
      </Field>
      <Field label="Alamat">
        <input name="address" defaultValue={branch?.address ?? ""} className={inputClass} />
      </Field>
      <div className="flex gap-3">
        <Field label="Latitude">
          <input ref={latRef} name="latitude" type="number" step="any" defaultValue={branch?.latitude} required placeholder="-6.200000" className={inputClass} />
        </Field>
        <Field label="Longitude">
          <input ref={lngRef} name="longitude" type="number" step="any" defaultValue={branch?.longitude} required placeholder="106.816666" className={inputClass} />
        </Field>
      </div>
      <div className="text-sm">
        <button type="button" onClick={fillCurrentLocation} disabled={locating} className="text-blue-600 underline disabled:opacity-60">
          {locating ? "Mengambil lokasi…" : "📍 Pakai lokasi saya sekarang"}
        </button>
        <span className="ml-2 text-gray-600">atau klik kanan titik lokasi di Google Maps lalu salin koordinatnya.</span>
        {geoError && <p className="text-red-600">{geoError}</p>}
      </div>
      <Field label="Radius toleransi (meter)">
        <input name="radiusMeter" type="number" min={10} defaultValue={branch?.radiusMeter ?? 100} className={inputClass} />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="allowDirectCheckin" defaultChecked={branch?.allowDirectCheckin ?? true} className="mt-1" />
        <span>
          Izinkan absen langsung dari HP tanpa scan QR
          <span className="block text-xs text-gray-600">
            Guru tetap harus berada dalam radius cabang. Matikan jika cabang ini wajib scan QR.
          </span>
        </span>
      </label>
    </>
  );
}
