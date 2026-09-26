"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateAttendance(attendanceId: number, formData: FormData) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      status: String(formData.get("status")) as
        | "HADIR"
        | "TELAT"
        | "IZIN"
        | "SAKIT"
        | "TIDAK_HADIR",
      notes: String(formData.get("notes") || ""),
      verifiedBy: Number(session.user.id),
    },
  });
  revalidatePath("/admin/attendances");
}
