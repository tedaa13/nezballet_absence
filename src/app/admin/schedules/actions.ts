"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
}

export async function createSchedule(formData: FormData) {
  await requireAdmin();
  const effectiveEndDateRaw = String(formData.get("effectiveEndDate") || "");

  await prisma.schedule.create({
    data: {
      branchId: Number(formData.get("branchId")),
      classId: Number(formData.get("classId")),
      teacherId: Number(formData.get("teacherId")),
      dayOfWeek: Number(formData.get("dayOfWeek")),
      startTime: String(formData.get("startTime")),
      endTime: String(formData.get("endTime")),
      effectiveStartDate: new Date(String(formData.get("effectiveStartDate"))),
      effectiveEndDate: effectiveEndDateRaw ? new Date(effectiveEndDateRaw) : null,
    },
  });
  revalidatePath("/admin/schedules");
}

export async function updateScheduleStatus(scheduleId: number, formData: FormData) {
  await requireAdmin();
  await prisma.schedule.update({
    where: { id: scheduleId },
    data: { status: String(formData.get("status")) as "ACTIVE" | "INACTIVE" },
  });
  revalidatePath("/admin/schedules");
}
