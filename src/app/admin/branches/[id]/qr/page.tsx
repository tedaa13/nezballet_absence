import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { canAccessBranch, requireAdmin } from "@/lib/admin";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { regenerateBranchQr } from "../../actions";

export default async function BranchQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = await requireAdmin();
  const branch = await prisma.branch.findUnique({ where: { id: Number(id) } });
  if (!branch || !canAccessBranch(scope, branch.id)) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (await requestOrigin());
  const scanUrl = `${baseUrl}/scan/${branch.id}/${branch.qrSecret}`;
  const qrDataUrl = await QRCode.toDataURL(scanUrl, { width: 400, margin: 2 });

  return (
    <div className="max-w-sm space-y-4 text-center">
      <h1 className="text-xl font-semibold">QR Cabang: {branch.name}</h1>
      <p className="text-sm text-gray-600">
        Cetak dan tempel QR ini di lokasi cabang. Guru cukup scan sekali per kunjungan — tidak
        perlu ganti QR tiap sesi.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt={`QR ${branch.name}`} className="mx-auto" />
      <a href={qrDataUrl} download={`qr-${branch.name}.png`} className="block text-blue-600 underline">
        Unduh PNG
      </a>
      <ActionForm
        action={regenerateBranchQr.bind(null, branch.id)}
        confirmMessage="Buat QR baru? QR lama yang sudah ditempel jadi tidak berlaku."
        className="space-y-2"
      >
        <SubmitButton variant="danger" pendingText="Membuat QR…">
          Buat ulang QR (QR lama jadi tidak berlaku)
        </SubmitButton>
      </ActionForm>
    </div>
  );
}

// Fallback when NEXT_PUBLIC_APP_URL is unset: the domain the admin is browsing on.
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
