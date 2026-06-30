const STATUS_MAP = {
  HARVESTED: { emoji: "🌱", label: "Harvested", className: "bg-primary-fixed text-on-primary-container" },
  CERTIFIED: { emoji: "✅", label: "Certified", className: "bg-tertiary-fixed text-on-tertiary-fixed" },
  IN_TRANSIT: { emoji: "🚚", label: "In Transit", className: "bg-secondary-fixed text-on-secondary-container" },
  DELIVERED: { emoji: "🏪", label: "Delivered", className: "bg-surface-container-high text-on-surface-variant" },
};

export default function StatusBadge({ status, className = "" }) {
  const info = STATUS_MAP[status] || { emoji: "•", label: status, className: "bg-surface-container text-on-surface-variant" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${info.className} ${className}`}
    >
      <span>{info.emoji}</span>
      {info.label}
    </span>
  );
}

export { STATUS_MAP };
