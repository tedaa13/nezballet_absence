import Link from "next/link";
import { auth, signOut } from "@/auth";

const NAV = [
  { href: "/admin/branches", label: "Cabang" },
  { href: "/admin/teachers", label: "Guru" },
  { href: "/admin/classes", label: "Kelas" },
  { href: "/admin/schedules", label: "Jadwal" },
  { href: "/admin/attendances", label: "Presensi" },
];

const SUPERADMIN_NAV = [{ href: "/admin/users", label: "Pengguna Admin" }];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Absensi Balet</span>
          <nav className="flex flex-wrap gap-4 text-sm">
            {[...NAV, ...(session?.user?.role === "SUPERADMIN" ? SUPERADMIN_NAV : []), { href: "/admin/account", label: "Akun" }].map((item) => (
              <Link key={item.href} href={item.href} className="text-gray-500 hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Link href="/admin/account" className="mr-3 text-sm text-gray-500 underline">
            {session?.user?.name}
          </Link>
          <button type="submit" className="text-sm text-blue-600 underline">
            Keluar
          </button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
