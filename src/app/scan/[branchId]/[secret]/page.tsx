import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveScanContext } from "@/lib/attendance";
import { ScanClient } from "./scan-client";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ branchId: string; secret: string }>;
}) {
  const { branchId, secret } = await params;
  const branchIdNum = Number(branchId);

  const branch = await prisma.branch.findUnique({ where: { id: branchIdNum } });
  if (!branch || branch.qrSecret !== secret || branch.status !== "ACTIVE") {
    return <div className="p-6">Kode QR tidak valid.</div>;
  }

  const session = await auth();

  if (!session?.user) {
    return (
      <div className="space-y-4 p-6">
        <p>Silakan login sebagai guru untuk melakukan presensi di {branch.name}.</p>
        <a
          href={`/login?callbackUrl=/scan/${branchIdNum}/${secret}`}
          className="text-blue-600 underline"
        >
          Login
        </a>
      </div>
    );
  }

  if (session.user.role !== "GURU" || !session.user.teacherId) {
    return <div className="p-6">Hanya guru yang bisa melakukan presensi.</div>;
  }

  const context = await resolveScanContext(session.user.teacherId, branchIdNum, new Date());

  if (!context) {
    return (
      <ScanClient mode="none" branchId={branchIdNum} secret={secret} branchName={branch.name} />
    );
  }

  const schedule = {
    id: context.schedule.id,
    className: context.schedule.class.name,
    startTime: context.schedule.startTime,
    endTime: context.schedule.endTime,
  };

  if (context.mode === "checkin") {
    return (
      <ScanClient
        mode="checkin"
        branchId={branchIdNum}
        secret={secret}
        branchName={branch.name}
        schedule={schedule}
      />
    );
  }

  if (context.mode === "checkout") {
    return (
      <ScanClient
        mode="checkout"
        branchId={branchIdNum}
        secret={secret}
        branchName={branch.name}
        schedule={schedule}
        attendanceId={context.attendance.id}
      />
    );
  }

  return (
    <ScanClient
      mode="done"
      branchId={branchIdNum}
      secret={secret}
      branchName={branch.name}
      schedule={schedule}
    />
  );
}
