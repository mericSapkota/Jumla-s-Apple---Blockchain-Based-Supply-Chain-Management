import { useMemo, useState } from "react";
import StatusBadge from "./StatusBadge";
import Icon from "../ui/Icon";
import { BATCH_SORT_OPTIONS, sortBatches } from "../../utils/batchSort";

const FRESHNESS_STYLES = {
  FRESH: "bg-tertiary-fixed text-on-tertiary-fixed",
  ROTTEN: "bg-error-container text-on-error-container",
  DAMAGED: "bg-error-container text-on-error-container",
};

function FreshnessBadge({ result }) {
  if (!result || result === "PENDING") return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
        FRESHNESS_STYLES[result] || "bg-surface-container-high text-on-surface-variant"
      }`}
    >
      <Icon name="science" size="11px" />
      {result}
    </span>
  );
}

export default function BatchTable({ batches, renderActions, emptyMessage = "No batches yet." }) {
  const [sortBy, setSortBy] = useState("recent");

  const sortedBatches = useMemo(() => sortBatches(batches, sortBy), [batches, sortBy]);

  if (!batches || batches.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl shadow-card p-10 text-center space-y-2">
        <Icon name="inventory_2" className="text-4xl text-outline-variant" />
        <p className="text-sm text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="batch-sort" className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
          <Icon name="sort" size="16px" />
          Sort by
        </label>
        <select
          id="batch-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-full px-3 py-1.5 text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary-fixed outline-none"
        >
          {BATCH_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <th className="px-4 py-4">Photo</th>
              <th className="px-4 py-4">Batch ID</th>
              <th className="px-4 py-4">Details</th>
              <th className="px-4 py-4">Status</th>
              {renderActions && <th className="px-4 py-4 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 text-sm">
            {sortedBatches.map((batch) => (
              <tr key={batch.batchId}>
                <td className="px-4 py-5">
                  {batch.photoPath ? (
                    <a href={batch.photoPath} target="_blank" rel="noopener noreferrer">
                      <img
                        src={batch.photoPath}
                        alt={`Apple batch ${batch.batchId}`}
                        className="w-14 h-14 rounded-xl object-cover border border-outline-variant/20 hover:scale-105 transition-transform"
                      />
                    </a>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center text-outline-variant">
                      <Icon name="no_photography" size="20px" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-5">
                  <div className="font-bold text-on-surface">#{batch.batchId}</div>
                  <div className="text-[10px] text-zinc-500">
                    {batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : ""}
                  </div>
                </td>
                <td className="px-4 py-5 text-xs text-on-surface">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{batch.appleVariety} · {batch.weightKg}kg</span>
                    <FreshnessBadge result={batch.aiResult} />
                  </div>
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
    </div>
  );
}
