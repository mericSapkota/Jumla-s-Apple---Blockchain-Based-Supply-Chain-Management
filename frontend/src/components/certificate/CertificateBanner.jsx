import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getCertificateStatus, downloadCertificate } from "../../api/certificateApi";
import Icon from "../ui/Icon";
import Button from "../ui/Button";

const REQUIRED = 5;

/**
 * Shown on Farmer / Cooperative / Transporter dashboards.
 * Fetches the user's blockchain-transaction count and renders:
 *  - a progress bar toward the 5-transaction milestone
 *  - a "Generate Certificate" button once eligible (and re-download if already issued)
 */
export default function CertificateBanner() {
  const [status, setStatus] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getCertificateStatus()
      .then(setStatus)
      .catch(() => {}); // silent — don't block the dashboard
  }, []);

  if (!status) return null;

  const { eligible, transactionCount, alreadyIssued, certificateNumber } = status;
  const progress = Math.min((transactionCount / REQUIRED) * 100, 100);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificate();
      toast.success("Certificate downloaded!");
      // Refresh status so the banner updates (e.g. shows certificate number)
      const updated = await getCertificateStatus();
      setStatus(updated);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not generate certificate");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section
      className={`rounded-3xl shadow-soft p-6 space-y-4 ${
        eligible ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icon
              name={eligible ? "workspace_premium" : "military_tech"}
              className={`text-2xl ${eligible ? "text-on-primary" : "text-primary"}`}
            />
            <h3 className="font-headline text-lg font-bold">
              {eligible ? "Certificate Ready!" : "Blockchain Certificate"}
            </h3>
          </div>
          <p className={`text-sm ${eligible ? "text-on-primary/80" : "text-on-surface-variant"}`}>
            {eligible
              ? alreadyIssued
                ? `Already issued · ${certificateNumber}`
                : "You've completed 5 blockchain transactions. Download your certificate."
              : `Complete ${REQUIRED - transactionCount} more blockchain transaction${
                  REQUIRED - transactionCount !== 1 ? "s" : ""
                } to earn your certificate.`}
          </p>
        </div>

        {eligible && (
          <Button
            icon={alreadyIssued ? "download" : "workspace_premium"}
            loading={downloading}
            onClick={handleDownload}
            className={"bg-white text-primary hover:bg-white"}
          >
            {alreadyIssued ? "Re-download" : "Generate Certificate"}
          </Button>
        )}
      </div>

      {/* Progress bar — always shown so user can track progress */}
      <div className="space-y-1.5">
        <div className={`w-full h-2 rounded-full ${eligible ? "bg-on-primary/20" : "bg-surface-container-high"}`}>
          <div
            className={`h-2 rounded-full transition-all duration-500 ${eligible ? "bg-on-primary" : "bg-primary"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={`text-[11px] font-medium ${eligible ? "text-on-primary/70" : "text-on-surface-variant"}`}>
          {transactionCount} / {REQUIRED} blockchain transactions
        </p>
      </div>
    </section>
  );
}
