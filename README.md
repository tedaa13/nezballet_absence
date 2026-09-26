# Absensi Guru Balet

Absensi guru berbasis web (bukan aplikasi mobile), memakai QR statis per cabang + validasi lokasi (GPS) & jadwal.

## Konsep singkat

- Tiap cabang punya **1 QR tetap** (dicetak, ditempel di lokasi) — tidak perlu device/admin standby di cabang.
- Guru scan QR pakai HP sendiri (browser). Backend yang memvalidasi:
  - apakah guru punya jadwal aktif di cabang itu sekarang (window: 15 menit sebelum jadwal s.d. jadwal selesai),
  - apakah lokasi GPS guru berada dalam radius toleransi cabang (Haversine, `src/lib/geo.ts`),
  - status HADIR/TELAT otomatis dari jam sistem.
- Scan kedua di sesi yang sama = absen keluar (checkout), sekaligus input jumlah murid hadir.
- 3 role: SUPERADMIN, ADMIN, GURU (lihat `prisma/schema.prisma`).

## Setup lokal

1. Copy `.env.example` ke `.env` dan isi `DATABASE_URL` (bisa pakai Postgres lokal atau gratis di [Neon](https://neon.tech)/[Supabase](https://supabase.com)).
2. Generate `AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
3. Install dependency & siapkan database:
   ```bash
   npm install
   npx prisma migrate dev --name init
   npm run seed
   ```
   Seed membuat 1 akun superadmin: `superadmin@studio.local` / `ubahsegera123` (ganti setelah login pertama).
4. Jalankan dev server:
   ```bash
   npm run dev
   ```

## Alur pemakaian

1. Superadmin/admin login di `/admin`, input data **Cabang** (termasuk koordinat lokasi & radius toleransi), **Guru**, **Kelas**, **Jadwal**.
2. Di halaman **Cabang → QR**, unduh & cetak QR untuk masing-masing cabang, tempel di lokasi.
3. Guru login di HP masing-masing, scan QR di lokasi saat datang & saat pulang.
4. Rekap presensi bisa dilihat/diedit manual di **Admin → Presensi**.

## Deploy ke cloud

- **Hosting**: [Vercel](https://vercel.com) — import repo GitHub, framework Next.js terdeteksi otomatis.
- **Database**: [Neon](https://neon.tech) (region Singapore) — hanya dipakai sebagai Postgres.
- Env var di Vercel:
  - `DATABASE_URL` — connection string Neon **pooled** (host mengandung `-pooler`)
  - `DIRECT_URL` — connection string Neon **non-pooled** (tanpa `-pooler`), dipakai `prisma migrate`
  - `AUTH_SECRET` — `openssl rand -base64 32`
  - `NEXT_PUBLIC_APP_URL` — domain produksi, mis. `https://absensi-xxx.vercel.app` (dipakai di link QR)
  - `APP_TIMEZONE` — opsional, default `Asia/Jakarta`
- Vercel menjalankan script `vercel-build`, yang otomatis `prisma migrate deploy` sebelum `next build`.
- Setelah deploy pertama, jalankan `npm run seed` sekali (dengan `DATABASE_URL` Neon) untuk akun superadmin awal, lalu segera ganti password-nya.
- Cetak QR cabang **setelah** `NEXT_PUBLIC_APP_URL` diisi domain produksi.
