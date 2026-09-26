import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { regenerateBranchQr } from "../../actions";

export default async function BranchQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const branch = await prisma.branch.findUnique({ where: { id: Number(id) } });
  if (!branch) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const scanUrl = `${baseUrl}/scan/${branch.id}/${branch.qrSecret}`;
  const qrDataUrl = await QRCode.toDataURL(scanUrl, { width: 400, margin: 2 });

  const regenerateWithId = regenerateBranchQr.bind(null, branch.id);

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
      <form action={regenerateWithId}>
        <button type="submit" className="rounded border px-4 py-2 text-sm text-red-600">
          Buat ulang QR (QR lama jadi tidak berlaku)
        </button>
      </form>
    </div>
  );
}
