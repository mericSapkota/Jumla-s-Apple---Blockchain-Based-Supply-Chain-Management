import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardShell from "../../components/layout/DashboardShell";
import BatchTable from "../../components/batch/BatchTable";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import { getBatchesByStatus, certifyBatch } from "../../api/batchApi";

export default function CooperativeDashboard() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certifyingId, setCertifyingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getBatchesByStatus("HARVESTED");
      setBatches(data);
    } catch {
      toast.error("Could not load pending batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCertify = async (batchId) => {
    setCertifyingId(batchId);
    try {
      await certifyBatch(batchId);
      toast.success(`Batch ${batchId} certified`);
      setBatches((prev) => prev.filter((b) => b.batchId !== batchId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not certify batch");
    } finally {
      setCertifyingId(null);
    }
  };

  return (
    <DashboardShell
      title="Jumla Trace"
      eyebrow="Cooperative Hub"
      heading="Pending certifications"
    >
      {loading ? (
        <div className="bg-surface-container-lowest rounded-3xl shadow-soft p-10 text-center text-on-surface-variant text-sm">
          Loading…
        </div>
      ) : (
        <BatchTable
          batches={batches}
          emptyMessage="No batches waiting for certification."
          renderActions={(batch) => (
            <Button
              variant="primary"
              icon="check_circle"
              loading={certifyingId === batch.batchId}
              onClick={() => handleCertify(batch.batchId)}
              className="!py-2 !px-4 text-xs"
            >
              Certify
            </Button>
          )}
        />
      )}

      <div className="text-center">
        <Link
          to="/batches/history"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <Icon name="receipt_long" size="18px" />
          View full batch history
        </Link>
      </div>
    </DashboardShell>
  );
}
