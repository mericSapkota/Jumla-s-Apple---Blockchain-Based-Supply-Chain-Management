// Shared admin table: columns = [{ key, label, render? }], rows keyed by rowKey.
export default function AdminTable({ columns, rows, rowKey = "id", emptyMessage = "Nothing here yet." }) {
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
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/50">
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
