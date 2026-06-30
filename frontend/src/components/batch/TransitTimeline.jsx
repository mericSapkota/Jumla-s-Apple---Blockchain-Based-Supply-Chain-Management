import Icon from "../ui/Icon";
import StatusBadge from "./StatusBadge";

const STAGE_ICONS = {
  HARVESTED: "potted_plant",
  CERTIFIED: "verified",
  IN_TRANSIT: "local_shipping",
  DELIVERED: "store",
};

function formatDate(value) {
  if (!value) return "—";
  const d = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function TransitTimeline({ batch }) {
  const stages = [
    {
      key: "HARVESTED",
      reached: true,
      date: batch.harvestDate,
      detail: (
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="font-bold text-on-surface">{batch.farmerName}</span>
          <span>· {batch.farmLocation}</span>
        </div>
      ),
      extra: (
        <p className="text-[10px] font-bold uppercase text-secondary">
          {batch.weightKg} kg · {batch.appleVariety}
        </p>
      ),
    },
    {
      key: "CERTIFIED",
      reached: ["CERTIFIED", "IN_TRANSIT", "DELIVERED"].includes(batch.status),
      date: batch.certifiedAt,
      detail: <p className="text-xs text-on-surface-variant">Certified by cooperative</p>,
    },
    {
      key: "IN_TRANSIT",
      reached: ["IN_TRANSIT", "DELIVERED"].includes(batch.status),
      date: batch.transitStartedAt,
      detail: (
        <p className="text-xs text-on-surface-variant">
          Destination: <span className="font-bold text-on-surface">{batch.destination || "—"}</span>
        </p>
      ),
      checkpoints: batch.transitHistory,
    },
    {
      key: "DELIVERED",
      reached: batch.status === "DELIVERED",
      date: batch.deliveredAt,
      detail: <p className="text-xs text-on-surface-variant">Arrived at final destination</p>,
    },
  ];

  return (
    <div className="relative pl-8 space-y-8">
      <div className="absolute left-[11px] top-4 bottom-4 w-1 bg-surface-dim rounded-full" />
      {stages.map((stage) => (
        <div key={stage.key} className="relative">
          <div
            className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-surface shadow-sm ${
              stage.reached ? "bg-primary" : "bg-surface-dim"
            }`}
          >
            <Icon
              name={STAGE_ICONS[stage.key]}
              size="14px"
              className={stage.reached ? "text-white" : "text-on-surface-variant"}
            />
          </div>
          <div
            className={`bg-surface-container-lowest rounded-2xl p-5 shadow-card border border-outline-variant/10 space-y-2 ${
              stage.reached ? "" : "opacity-50"
            }`}
          >
            <div className="flex justify-between items-start">
              <StatusBadge status={stage.key} />
              <span className="text-[11px] text-on-surface-variant font-medium">
                {stage.reached ? formatDate(stage.date) : "Pending"}
              </span>
            </div>
            {stage.detail}
            {stage.extra}
            {stage.checkpoints?.length > 0 && (
              <div className="pt-2 mt-2 border-t border-outline-variant/10 space-y-1">
                {stage.checkpoints.map((cp, i) => (
                  <div key={i} className="flex justify-between text-[11px] text-on-surface-variant">
                    <span className="font-semibold text-on-surface">{cp.location}</span>
                    <span>{formatDate(cp.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
