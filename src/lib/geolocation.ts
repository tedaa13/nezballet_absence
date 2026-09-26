/** Browser-side: one high-accuracy GPS fix, with Indonesian error messages. */
export function getLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser tidak mendukung deteksi lokasi."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        const messages: Record<number, string> = {
          1: "Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser.",
          2: "Lokasi tidak tersedia. Pastikan GPS HP menyala.",
          3: "Waktu mengambil lokasi habis. Coba lagi di tempat terbuka.",
        };
        reject(new Error(messages[err.code] ?? "Gagal mengambil lokasi."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
