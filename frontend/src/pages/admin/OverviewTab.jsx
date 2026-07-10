import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import toast from "react-hot-toast";
import { fetchAnalytics } from "../../api/adminApi";
import Icon from "../../components/ui/Icon";

// Validated series palette (dataviz slots 1 & 2 on the light card surface).
const SERIES_1 = "#2a78d6";
const SERIES_2 = "#1baf7a";
const INK_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";

export default function OverviewTab() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch(() => toast.error("Could not load analytics"));
  }, []);

  if (!data) {
    return <p className="text-on-surface-variant">Loading analytics…</p>;
  }

  const roleRows = Object.entries(data.usersByRole || {})
    .filter(([role]) => role !== "SUPERADMIN")
    .map(([role, count]) => ({ name: role.charAt(0) + role.slice(1).toLowerCase(), count }));

  const statusRows = Object.entries(data.batchesByStatus || {}).map(([status, count]) => ({
    name: status.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    count,
  }));

  const months = Object.keys(data.signupsByMonth || {});
  const timeline = months.map((m) => ({
    month: m.slice(2).replace("-", "/"), // "26/07"
    signups: data.signupsByMonth[m] ?? 0,
    donations: data.donationsByMonth?.[m] ?? 0,
  }));

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Superadmin</p>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Overview</h1>
      </header>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon="group" label="Users" value={data.totalUsers} />
        <StatTile icon="package_2" label="Batches" value={data.totalBatches} />
        <StatTile icon="article" label="Blog posts" value={data.totalBlogs} />
        <StatTile
          icon="volunteer_activism"
          label="Donations received"
          value={`Rs. ${Number(data.donationTotal).toLocaleString()}`}
          hint={`${data.completedDonations} completed`}
        />
      </div>

      {/* Category bars */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Users by role">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={roleRows} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRIDLINE} strokeWidth={1} />
              <XAxis dataKey="name" tick={{ fill: INK_MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: INK_MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="count" name="Users" fill={SERIES_1} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Batches by status">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusRows} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRIDLINE} strokeWidth={1} />
              <XAxis dataKey="name" tick={{ fill: INK_MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: INK_MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="count" name="Batches" fill={SERIES_1} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 12-month timeline */}
      <ChartCard
        title="Last 12 months"
        legend={
          <div className="flex items-center gap-4 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: SERIES_1 }} />
              Signups
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: SERIES_2 }} />
              Completed donations
            </span>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={timeline} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRIDLINE} strokeWidth={1} />
            <XAxis dataKey="month" tick={{ fill: INK_MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: INK_MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="signups" name="Signups" stroke={SERIES_1} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="donations" name="Completed donations" stroke={SERIES_2} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function StatTile({ icon, label, value, hint }) {
  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-soft">
      <div className="flex items-center gap-2 text-on-surface-variant mb-2">
        <Icon name={icon} size="18px" className="text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold text-on-surface">{value}</p>
      {hint && <p className="text-xs text-on-surface-variant mt-1">{hint}</p>}
    </div>
  );
}

function ChartCard({ title, legend, children }) {
  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="font-bold text-on-surface">{title}</h2>
        {legend}
      </div>
      {children}
    </div>
  );
}
