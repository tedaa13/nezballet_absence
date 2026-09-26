import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Absensi Balet</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/teacher">Jadwal Saya</Link>
            <Link href="/teacher/history">Riwayat</Link>
          </nav>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <span className="mr-3 text-sm text-gray-500">{session?.user?.name}</span>
          <button type="submit" className="text-sm text-blue-600 underline">
            Keluar
          </button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
