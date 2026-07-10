import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchAllDonations } from "../../api/adminApi";
import AdminTable from "./AdminTable";
import { formatDate } from "../../utils/formatDate";

const STATUS_STYLES = {
  COMPLETE: "bg-primary-fixed text-on-primary-container",
  PENDING: "bg-secondary-fixed text-on-secondary-container",
  FAILED: "bg-error-container text-on-error-container",
};

export default function DonationsTab() {
  const [donations, setDonations] = useState(null);

  useEffect(() => {
    fetchAllDonations()
      .then(setDonations)
      .catch(() => toast.error("Could not load donations"));
  }, []);

  const completedTotal = (donations || [])
    .filter((d) => d.status === "COMPLETE")
    .reduce((sum, d) => sum + d.amount, 0);

  const columns = [
    {
      key: "donorName",
      label: "Donor",
      render: (d) => (
        <div>
          <p className="font-bold">{d.donorName || "Anonymous"}</p>
          {d.message && <p className="text-xs text-on-surface-variant italic">“{d.message}”</p>}
        </div>
      ),
    },
    { key: "amount", label: "Amount", render: (d) => `Rs. ${Number(d.amount).toLocaleString()}` },
    {
      key: "status",
      label: "Status",
      render: (d) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            STATUS_STYLES[d.status] || "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          {d.status}
        </span>
      ),
    },
    {
      key: "esewaTransactionCode",
      label: "eSewa ref",
      render: (d) => <span className="font-mono text-xs">{d.esewaTransactionCode || "—"}</span>,
    },
    { key: "createdAt", label: "Date", render: (d) => formatDate(d.createdAt) },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Superadmin</p>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Donations</h1>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl px-5 py-3 shadow-soft text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total received</p>
          <p className="text-xl font-bold text-primary">Rs. {completedTotal.toLocaleString()}</p>
        </div>
      </header>

      {donations === null ? (
        <p className="text-on-surface-variant">Loading donations…</p>
      ) : (
        <AdminTable columns={columns} rows={donations} emptyMessage="No donations yet." />
      )}
    </div>
  );
}
