import { useState } from "react";
import toast from "react-hot-toast";
import { getQrUrl } from "../../api/batchApi";
import Icon from "../ui/Icon";

export default function QRDisplay({ batchId, size = 160, showDownload = true }) {
  const [downloading, setDownloading] = useState(false);

  // The QR image lives on the backend (a different origin from Vite), so a
  // plain <a download> is ignored by the browser. Fetching it as a blob and
  // saving that blob works cross-origin and lets us set a friendly filename.
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(getQrUrl(batchId));
      if (!res.ok) throw new Error("bad response");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jumla-qr-${batchId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the QR code");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-card inline-flex flex-col items-center gap-2">
      <img
        src={getQrUrl(batchId)}
        alt={`QR code for batch ${batchId}`}
        width={size}
        height={size}
        className="rounded-lg"
      />
      <span className="text-[10px] font-mono text-zinc-500">{batchId}</span>
      {showDownload && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full px-4 py-2 hover:bg-primary/15 active:scale-95 transition-all disabled:opacity-50"
        >
          <Icon
            name={downloading ? "progress_activity" : "download"}
            size="16px"
            className={downloading ? "animate-spin" : ""}
          />
          {downloading ? "Preparing…" : "Download QR"}
        </button>
      )}
    </div>
  );
}
