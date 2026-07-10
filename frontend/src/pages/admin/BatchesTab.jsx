import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchAllBatches } from "../../api/adminApi";
import AdminTable from "./AdminTable";
import { formatDate } from "../../utils/formatDate";
import StatusBadge from "../../components/batch/StatusBadge";

export default function BatchesTab() {
  const [batches, setBatches] = useState(null);

  useEffect(() => {
    fetchAllBatches()
      .then(setBatches)
      .catch(() => toast.error("Could not load batches"));
  }, []);

  const columns = [
    { key: "batchId", label: "Batch ID", render: (b) => <span className="font-mono text-xs">{b.batchId}</span> },
    {
      key: "farmerName",
      label: "Farmer",
      render: (b) => (
        <div>
          <p className="font-bold">{b.farmerName || "—"}</p>
          <p className="text-xs text-on-surface-variant">{b.farmerEmail}</p>
        </div>
      ),
    },
    { key: "appleVariety", label: "Variety" },
    { key: "weightKg", label: "Weight (kg)" },
    { key: "farmLocation", label: "Location" },
    { key: "status", label: "Status", render: (b) => <StatusBadge status={b.status} /> },
    { key: "createdAt", label: "Created", render: (b) => formatDate(b.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Superadmin</p>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Batches</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Read-only — batch records are anchored on the blockchain and cannot be edited here.
        </p>
      </header>

      {batches === null ? (
        <p className="text-on-surface-variant">Loading batches…</p>
      ) : (
        <AdminTable columns={columns} rows={batches} rowKey="batchId" emptyMessage="No batches yet." />
      )}
    </div>
  );
}
