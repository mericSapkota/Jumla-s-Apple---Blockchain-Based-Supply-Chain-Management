import StatusBadge from "./StatusBadge";
import Icon from "../ui/Icon";

export default function BatchTable({ batches, renderActions, emptyMessage = "No batches yet." }) {
  if (!batches || batches.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl shadow-card p-10 text-center space-y-2">
        <Icon name="inventory_2" className="text-4xl text-outline-variant" />
        <p className="text-sm text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <th className="px-4 py-4">Batch ID</th>
              <th className="px-4 py-4">Details</th>
              <th className="px-4 py-4">Status</th>
              {renderActions && <th className="px-4 py-4 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 text-sm">
            {batches.map((batch) => (
              <tr key={batch.batchId}>
                <td className="px-4 py-5">
                  <div className="font-bold text-on-surface">#{batch.batchId}</div>
                  <div className="text-[10px] text-zinc-500">
                    {batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : ""}
                  </div>
                </td>
                <td className="px-4 py-5 text-xs text-on-surface">
                  {batch.appleVariety} · {batch.weightKg}kg
                  <div className="text-[10px]">{batch.farmLocation}</div>
                </td>
                <td className="px-4 py-5">
                  <StatusBadge status={batch.status} />
                </td>
                {renderActions && <td className="px-4 py-5 text-right whitespace-nowrap">{renderActions(batch)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
