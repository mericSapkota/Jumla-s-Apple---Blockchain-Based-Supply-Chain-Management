// Shared sort options for batch lists (BatchTable + dashboards) so the
// "Sort by" control behaves identically everywhere.
const num = (v) => Number(v ?? 0);
const dateVal = (b) => Date.parse(b.createdAt || b.harvestDate || 0) || 0;

export const BATCH_SORT_OPTIONS = [
  { value: "recent", label: "Newest first", cmp: (a, b) => dateVal(b) - dateVal(a) },
  { value: "oldest", label: "Oldest first", cmp: (a, b) => dateVal(a) - dateVal(b) },
  {
    value: "batchId",
    label: "Batch ID (A–Z)",
    cmp: (a, b) => String(a.batchId).localeCompare(String(b.batchId), undefined, { numeric: true }),
  },
  { value: "weightDesc", label: "Weight (high–low)", cmp: (a, b) => num(b.weightKg) - num(a.weightKg) },
  { value: "weightAsc", label: "Weight (low–high)", cmp: (a, b) => num(a.weightKg) - num(b.weightKg) },
  { value: "status", label: "Status", cmp: (a, b) => String(a.status).localeCompare(String(b.status)) },
];

export function sortBatches(list, sortBy) {
  const cmp = BATCH_SORT_OPTIONS.find((o) => o.value === sortBy)?.cmp;
  return cmp ? [...(list || [])].sort(cmp) : list || [];
}
