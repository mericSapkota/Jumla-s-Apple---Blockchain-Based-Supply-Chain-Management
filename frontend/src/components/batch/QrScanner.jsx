import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const REGION_ID = "qr-reader-region";

export default function QrScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(REGION_ID);
    scannerRef.current = scanner;
    let cancelled = false;
    hasScannedRef.current = false;
    isRunningRef.current = false;

    const safeStop = () =>
      isRunningRef.current ? scanner.stop().catch(() => {}) : Promise.resolve();

    const safeClear = () => {
      try {
        const result = scanner.clear();
        if (result && typeof result.catch === "function") {
          result.catch(() => {});
        }
      } catch {
        // never initialized or already cleared — ignore
      }
    };

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

          let value = decodedText;
          try {
            const url = new URL(decodedText);
            const fromUrl = url.searchParams.get("batchId");
            if (fromUrl) value = fromUrl;
          } catch {
            // not a URL, use raw text as-is
          }

          safeStop().finally(() => {
            isRunningRef.current = false;
            onScan(value);
          });
        },
        () => {
          // ignore per-frame scan failures
        }
      )
      .then(() => {
        if (!cancelled) isRunningRef.current = true;
      })
      .catch((err) => {
        onError?.(err);
      });

    return () => {
      cancelled = true;
      safeStop().then(safeClear).catch(safeClear);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={REGION_ID} className="rounded-2xl overflow-hidden bg-black/5" />;
}
