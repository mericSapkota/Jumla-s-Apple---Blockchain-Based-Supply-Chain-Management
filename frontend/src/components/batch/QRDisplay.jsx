import { getQrUrl } from "../../api/batchApi";

export default function QRDisplay({ batchId, size = 160 }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-card inline-flex flex-col items-center gap-2">
      <img
        src={getQrUrl(batchId)}
        alt={`QR code for batch ${batchId}`}
        width={size}
        height={size}
        className="rounded-lg"
      />
      <span className="text-[10px] font-mono text-on-surface-variant">{batchId}</span>
    </div>
  );
}
