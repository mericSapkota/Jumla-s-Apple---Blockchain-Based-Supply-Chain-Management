import { useMemo, useState } from "react";

// Null-safe comparison that adapts to the value type: numbers numerically,
// ISO date strings chronologically, everything else as natural-sorted text.
function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

// Shared admin table: columns = [{ key, label, render?, sortable?, sortAccessor? }].
// Click a column header to sort by it (toggles asc/desc). Action columns
// (key "actions") and columns with sortable:false are not sortable.
export default function AdminTable({ columns, rows, rowKey = "id", emptyMessage = "Nothing here yet." }) {
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const isSortable = (col) => col.sortable !== false && col.key !== "actions";

  const sortedRows = useMemo(() => {
    const list = rows || [];
    if (!sort.key) return list;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return list;
    const accessor = col.sortAccessor || ((row) => row[sort.key]);
    return [...list].sort((r1, r2) => {
      const res = compareValues(accessor(r1), accessor(r2));
      return sort.dir === "asc" ? res : -res;
    });
  }, [rows, columns, sort]);

  const toggleSort = (key) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );

  if (!rows?.length) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-10 text-center text-on-surface-variant shadow-soft">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl shadow-soft overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-outline-variant/20">
            {columns.map((col) => {
              const sortable = isSortable(col);
              const active = sort.key === col.key;
              return (
                <th
                  key={col.key}
                  onClick={sortable ? () => toggleSort(col.key) : undefined}
                  className={`text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap ${
                    sortable ? "cursor-pointer select-none hover:text-on-surface" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortable && (
                      <span
                        className={`material-symbols-outlined text-[14px] leading-none ${
                          active ? "opacity-100" : "opacity-30"
                        }`}
                      >
                        {active ? (sort.dir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr
              key={row[rowKey]}
              className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/50"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-3.5 text-on-surface align-middle">
                  {col.render ? col.render(row) : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
