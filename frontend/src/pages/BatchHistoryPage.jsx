import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardShell from "../components/layout/DashboardShell";
import BatchTable from "../components/batch/BatchTable";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import QRDisplay from "../components/batch/QRDisplay";
import { getMyBatches, getAllBatchesAcrossStatuses } from "../api/batchApi";
import { exportBatchesToExcel } from "../utils/exportExcel";
import { useAuth } from "../auth/AuthContext";

export default function BatchHistoryPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [qrBatch, setQrBatch] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      // Farmers see their own batches; everyone else gets the full
      // cross-status history (no per-role "mine" endpoint exists yet
      // for cooperative/transporter/consumer on the backend).
      const data =
        user?.role === "FARMER" ? await getMyBatches() : await getAllBatchesAcrossStatuses();
      setBatches(data);
    } catch {
      toast.error("Could not load batch history", { id: "history-load-error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = () => {
    if (batches.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    setExporting(true);
    try {
      exportBatchesToExcel(batches, `jumla-batches-${(user?.role || "all").toLowerCase()}`);
      toast.success("Excel file downloaded");
    } catch {
      toast.error("Could not generate Excel file");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardShell
      title="Jumla Trace"
      eyebrow={`${user?.role || ""} · All transactions`}
      heading="Batch history"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-on-surface-variant">
          {loading ? "Loading…" : `${batches.length} batch${batches.length === 1 ? "" : "es"} found`}
        </p>
        <Button
          icon="download"
          onClick={handleExport}
          loading={exporting}
          disabled={loading || batches.length === 0}
          className="!w-auto"
        >
          Download Excel
        </Button>
      </div>

      {loading ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-soft p-10 text-center text-on-surface-variant text-sm">
          Loading…
        </div>
      ) : (
        <BatchTable
          batches={batches}
          emptyMessage="No batch transactions yet."
          renderActions={(batch) => (
            <Button className="!w-auto" onClick={() => setQrBatch(batch)}>
              View QR
            </Button>
          )}
        />
      )}

      <Modal isOpen={!!qrBatch} onClose={() => setQrBatch(null)}>
        {qrBatch && <QRDisplay batchId={qrBatch.batchId} size={220} />}
      </Modal>
    </DashboardShell>
  );
}
