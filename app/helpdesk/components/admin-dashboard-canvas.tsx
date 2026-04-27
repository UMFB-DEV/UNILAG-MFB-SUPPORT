import type { Ticket, User } from "@/lib/helpdesk/demoData";

type Stats = {
  total: number;
  open: number;
  progress: number;
  resolved: number;
  closed: number;
};

function responseMinutes(userId: number, tickets: Ticket[]) {
  const assigned = tickets.filter((t) => t.assignedTo === userId);
  if (!assigned.length) return 0;
  const avgMs =
    assigned.reduce((sum, t) => sum + Math.max(1, t.updated - t.created), 0) /
    assigned.length;
  return Math.max(1, Math.round(avgMs / 60000));
}

export function AdminDashboardCanvas({
  stats,
  tickets,
  users,
}: {
  stats: Stats;
  tickets: Ticket[];
  users: User[];
}) {
  const resolvedToday = tickets.filter(
    (t) =>
      t.resolvedAt &&
      new Date(t.resolvedAt).toDateString() === new Date().toDateString(),
  ).length;

  const high = tickets.filter((t) => t.priority === "High").length;
  const medium = tickets.filter((t) => t.priority === "Medium").length;
  const low = tickets.filter((t) => t.priority === "Low").length;
  const totalPriorities = Math.max(1, high + medium + low);

  const urgentPct = Math.round((high / totalPriorities) * 100);
  const mediumPct = Math.round((medium / totalPriorities) * 100);
  const lowPct = Math.max(0, 100 - urgentPct - mediumPct);

  const agents = users.filter((u) => u.role === "agent" || u.role === "admin");

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold text-zinc-100">Archive Overview</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Real-time performance metrics for Obsidian Archive
          </p>
        </div>
        <div className="flex rounded-lg border border-[#1F1F21] bg-[#111111] p-1">
          <button className="rounded-md bg-[#1A1A1A] px-4 py-1.5 text-xs font-bold text-[#D4A373]">
            Today
          </button>
          <button className="px-4 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300">
            Week
          </button>
          <button className="px-4 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300">
            Month
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricBlock label="Total Tickets" value={stats.total} delta="+12%" icon="article" />
        <MetricBlock label="Open Tickets" value={stats.open} delta="+4%" icon="pending" />
        <MetricBlock label="Resolved Today" value={resolvedToday} delta="+8%" icon="check_circle" />
        <MetricBlock
          label="Avg Resolution Time"
          value={`${Math.max(1, Math.round((stats.resolved + stats.closed) ? 2.4 : 0))}h`}
          delta="-18%"
          icon="timer"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-[#1F1F21] bg-[#111111] p-6 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-lg font-medium text-zinc-100">Tickets Activity</h4>
            <span className="text-zinc-500">⋯</span>
          </div>
          <div className="flex h-64 items-end gap-2">
            {[40, 65, 55, 85, 45, 35, 60, 75, 50, 90].map((h, idx) => (
              <div
                key={idx}
                className={`flex-1 rounded-t-sm ${
                  h >= 85
                    ? "border-t-2 border-[#D4A373] bg-gradient-to-t from-[#D4A373]/40 to-[#D4A373]/10"
                    : "bg-gradient-to-t from-[#D4A373]/20 to-[#D4A373]/5"
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col rounded-xl border border-[#1F1F21] bg-[#111111] p-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-zinc-100">Priority Level</h4>
            <p className="mt-1 text-xs text-zinc-500">
              Current open ticket distribution
            </p>
          </div>
          <ProgressRow label="Urgent" value={urgentPct} bar="bg-rose-500" />
          <ProgressRow label="High" value={urgentPct} bar="bg-[#D4A373]" />
          <ProgressRow label="Medium" value={mediumPct} bar="bg-cyan-400" />
          <ProgressRow label="Low" value={lowPct} bar="bg-zinc-500" />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#1F1F21] bg-[#111111]">
        <div className="flex items-center justify-between border-b border-[#1F1F21] p-6">
          <div>
            <h4 className="text-lg font-medium text-zinc-100">Agent Performance</h4>
            <p className="mt-1 text-xs text-zinc-500">
              Archive specialists and current capacity
            </p>
          </div>
          <button className="text-xs font-bold text-[#D4A373] hover:underline">
            View All Agents
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#1A1A1A]/50 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                <th className="px-6 py-4">Specialist</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Active</th>
                <th className="px-6 py-4 text-center">Resolved</th>
                <th className="px-6 py-4 text-right">Avg Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F21]">
              {agents.slice(0, 3).map((a) => {
                const active = tickets.filter(
                  (t) => t.assignedTo === a.id && (t.status === "Open" || t.status === "In Progress"),
                ).length;
                const resolved = tickets.filter(
                  (t) => t.assignedTo === a.id && (t.status === "Resolved" || t.status === "Closed"),
                ).length;
                const avg = responseMinutes(a.id, tickets);
                return (
                  <tr key={a.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-zinc-100"
                          style={{ backgroundColor: a.color }}
                        >
                          {a.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">{a.name}</p>
                          <p className="text-[10px] text-zinc-500">
                            {a.role === "admin" ? "Head of Archives" : "L3 Support"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs text-zinc-400">Online</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-zinc-300">{active}</td>
                    <td className="px-6 py-4 text-center text-zinc-300">{resolved}</td>
                    <td className="px-6 py-4 text-right text-zinc-100">{avg}m</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between border-t border-[#1F1F21] px-2 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
        <div className="flex gap-6">
          <span>System Health: Optimal</span>
          <span>Server: Obsidian-Alpha-12</span>
        </div>
        <span>© 2024 Obsidian Archive Technology</span>
      </footer>
    </div>
  );
}

function MetricBlock({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string | number;
  delta: string;
  icon: string;
}) {
  const iconSvg =
    icon === "article" ? (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m-6-8h6M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    ) : icon === "pending" ? (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : icon === "check_circle" ? (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );

  return (
    <div className="space-y-4 rounded-xl border border-[#1F1F21] bg-[#111111] p-6">
      <div className="flex items-start justify-between">
        <span className="rounded-lg bg-[#D4A373]/10 p-2 text-[#D4A373]">{iconSvg}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
          {delta}
        </span>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
        <h3 className="mt-1 text-3xl font-bold text-zinc-100">{value}</h3>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  bar,
}: {
  label: string;
  value: number;
  bar: string;
}) {
  return (
    <div className="mb-5 space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-300">{label}</span>
        <span className="font-bold text-zinc-100">{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A1A1A]">
        <div className={`h-full ${bar}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

