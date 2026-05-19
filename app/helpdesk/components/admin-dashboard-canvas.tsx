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
    assigned.reduce((sum, t) => {
      const end = t.resolvedAt ?? t.updated;
      return sum + Math.max(1, end - t.created);
    }, 0) / assigned.length;
  return Math.max(1, Math.round(avgMs / 60000));
}

function avgResolutionHoursFromTickets(tickets: Ticket[]) {
  const resolved = tickets.filter(
    (t) => typeof t.resolvedAt === "number" && t.resolvedAt > 0,
  );
  if (!resolved.length) return null;
  const avgMs =
    resolved.reduce(
      (sum, t) => sum + Math.max(1, (t.resolvedAt as number) - t.created),
      0,
    ) / resolved.length;
  return Math.max(0.1, Math.round((avgMs / 3_600_000) * 10) / 10);
}

function avgResolutionMinutesFromTickets(tickets: Ticket[]) {
  const resolved = tickets.filter(
    (t) => typeof t.resolvedAt === "number" && t.resolvedAt > 0,
  );
  if (!resolved.length) return null;
  const avgMs =
    resolved.reduce(
      (sum, t) => sum + Math.max(1, (t.resolvedAt as number) - t.created),
      0,
    ) / resolved.length;
  return Math.max(1, Math.round(avgMs / 60_000));
}

function formatDurationMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours}h`;
}

export function AgentPerformanceTable({
  tickets,
  users,
  limit,
  onViewAllAgents,
  showViewAllAgentsButton,
}: {
  tickets: Ticket[];
  users: (User & {
    department?: string | null;
    averageAssignedToResolvedMinutes?: number | null;
  })[];
  limit?: number;
  onViewAllAgents?: () => void;
  showViewAllAgentsButton?: boolean;
}) {
  const agents = users.filter((u) => u.role === "agent" || u.role === "admin");
  const visibleAgents =
    typeof limit === "number" ? agents.slice(0, limit) : agents;

  return (
    <section className="overflow-hidden rounded-xl border border-[#1F1F21] bg-[#111111]">
      <div className="flex items-center justify-between border-b border-[#1F1F21] p-6">
        <div>
          <h4 className="text-lg font-medium text-zinc-100">
            Agent Performance
          </h4>
          <p className="mt-1 text-xs text-zinc-500">
            Archive specialists and current capacity
          </p>
        </div>
        {showViewAllAgentsButton ? (
          <button
            className="text-xs font-bold text-[#ACD23C] hover:underline"
            type="button"
            onClick={onViewAllAgents}
          >
            View All Agents
          </button>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#1A1A1A]/50 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              <th className="px-6 py-4">Specialist</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4 text-center">Active</th>
              <th className="px-6 py-4 text-center">Resolved</th>
              <th className="px-6 py-4 text-right">Avg Response</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F1F21]">
            {visibleAgents.map((a) => {
              const active = tickets.filter(
                (t) =>
                  t.assignedTo === a.id &&
                  (t.status === "Open" || t.status === "In Progress"),
              ).length;
              const resolved = tickets.filter(
                (t) =>
                  t.assignedTo === a.id &&
                  (t.status === "Resolved" || t.status === "Closed"),
              ).length;
              const avgMinutes =
                typeof a.averageAssignedToResolvedMinutes === "number"
                  ? a.averageAssignedToResolvedMinutes
                  : responseMinutes(a.id, tickets);
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
                        <p className="text-sm font-semibold text-zinc-200">
                          {a.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {a.role === "admin" ? "Admin" : "Support Agent"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {a.department ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-center text-zinc-300">
                    {active}
                  </td>
                  <td className="px-6 py-4 text-center text-zinc-300">
                    {resolved}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-100">
                    {typeof avgMinutes === "number"
                      ? formatDurationMinutes(avgMinutes)
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AdminDashboardCanvas({
  stats,
  tickets,
  users,
  averageResolutionMinutes,
  closedTickets,
  onViewAllAgents,
  loading,
}: {
  stats: Stats;
  tickets: Ticket[];
  users: User[];
  averageResolutionMinutes?: number | null;
  closedTickets: number;
  onViewAllAgents?: () => void;
  loading?: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const resolvedToday = tickets.filter(
    (t) =>
      t.resolvedAt &&
      new Date(t.resolvedAt).toDateString() === new Date().toDateString(),
  ).length;

  const high = tickets.filter((t) => t.priority === "High").length;
  const medium = tickets.filter((t) => t.priority === "Medium").length;
  const low = tickets.filter((t) => t.priority === "Low").length;
  const totalPriorities = Math.max(1, high + medium + low);

  const highPct = Math.round((high / totalPriorities) * 100);
  const mediumPct = Math.round((medium / totalPriorities) * 100);
  const lowPct = Math.max(0, 100 - highPct - mediumPct);

  const avgResolutionMinutes =
    typeof averageResolutionMinutes === "number"
      ? averageResolutionMinutes
      : avgResolutionMinutesFromTickets(tickets);

  const day = 86_400_000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  const activitySeries = Array.from({ length: 10 }).map((_, i) => {
    const start = todayStart - (9 - i) * day;
    const end = start + day;
    const count = tickets.filter(
      (t) => t.created >= start && t.created < end,
    ).length;
    const date = new Date(start);
    const label = date.toLocaleDateString(undefined, { weekday: "short" });
    const fullLabel = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
    return { start, end, count, label, fullLabel };
  });
  const activityBuckets = activitySeries.map((s) => s.count);
  const maxBucket = Math.max(1, ...activityBuckets);
  const activityHeights = activityBuckets.map((n) =>
    Math.round((n / maxBucket) * 100),
  );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricBlock
          label="Total"
          value={stats.total}
          delta="—"
          icon="article"
          loading={loading}
        />
        <MetricBlock
          label="Open"
          value={stats.open}
          delta="—"
          icon="pending"
          loading={loading}
        />
        <MetricBlock
          label="In Progress"
          value={stats.progress}
          delta="—"
          icon="pending"
          loading={loading}
        />
        <MetricBlock
          label="Resolved"
          value={stats.resolved}
          delta="—"
          icon="check_circle"
          loading={loading}
        />
        <MetricBlock
          label="Closed"
          value={closedTickets}
          delta="—"
          icon="check_circle"
          loading={loading}
        />
        <MetricBlock
          label="Avg Resolution"
          value={
            avgResolutionMinutes === null || avgResolutionMinutes === undefined
              ? "—"
              : formatDurationMinutes(avgResolutionMinutes)
          }
          delta="—"
          icon="timer"
          loading={loading}
        />
      </section>

      {loading ? null : (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-[#1F1F21] bg-[#111111] p-6 xl:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-lg font-medium text-zinc-100">
                  Tickets Activity
                </h4>
                <span className="text-zinc-500">⋯</span>
              </div>
              <div className="flex h-64 items-end gap-2">
                {activityHeights.map((h, idx) => {
                  const s = activitySeries[idx];
                  return (
                    <div
                      key={idx}
                      title={`${s.fullLabel}: ${s.count} ticket${s.count === 1 ? "" : "s"}`}
                      className={`flex-1 rounded-t-sm ${
                        h >= 85
                          ? "border-t-2 border-[#7b3434] bg-gradient-to-t from-[#7b3434]/40 to-[#7b3434]/10"
                          : "bg-gradient-to-t from-[#7b3434]/20 to-[#7b3434]/5"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-10 gap-2 text-center text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                {activitySeries.map((s, idx) => (
                  <div key={idx} title={s.fullLabel}>
                    {s.label}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                Hover a bar to see the exact date and ticket count.
              </p>
            </div>
            <div className="flex flex-col rounded-xl border border-[#1F1F21] bg-[#111111] p-6">
              <div className="mb-6">
                <h4 className="text-lg font-medium text-zinc-100">
                  Priority Level
                </h4>
                <p className="mt-1 text-xs text-zinc-500">
                  Current open ticket distribution
                </p>
              </div>
              <ProgressRow label="High" value={highPct} bar="bg-[#7b3434]" />
              <ProgressRow
                label="Medium"
                value={mediumPct}
                bar="bg-[#ACD23C]"
              />
              <ProgressRow label="Low" value={lowPct} bar="bg-zinc-500" />
            </div>
          </section>

          <AgentPerformanceTable
            tickets={tickets}
            users={users}
            limit={5}
            onViewAllAgents={onViewAllAgents}
            showViewAllAgentsButton
          />

          <footer className="flex flex-wrap items-center justify-between border-t border-[#1F1F21] px-2 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
            <div className="flex gap-6">
              <span>System Health: Optimal</span>
              <span>Server: Production</span>
            </div>
            <span>© {currentYear} UNILAG MFB TICKETING SYSTEM</span>
          </footer>
        </>
      )}
    </div>
  );
}

function MetricBlock({
  label,
  value,
  delta,
  icon,
  loading,
}: {
  label: string;
  value: string | number;
  delta: string;
  icon: string;
  loading?: boolean;
}) {
  const iconSvg =
    icon === "article" ? (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m-6-8h6M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
        />
      </svg>
    ) : icon === "pending" ? (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ) : icon === "check_circle" ? (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ) : (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );

  return (
    <div
      className={`space-y-4 rounded-xl border border-[#1F1F21] bg-[#111111] p-6 ${loading ? "animate-pulse" : ""}`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`rounded-lg p-2 ${loading ? "bg-zinc-800/70 text-zinc-700" : "bg-[#7b3434]/10 text-[#7b3434]"}`}
        >
          {iconSvg}
        </span>
        {loading ? (
          <span className="h-4 w-10 rounded-full bg-zinc-800/70" />
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            {delta}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </p>
        {loading ? (
          <div className="mt-2 h-8 w-24 rounded bg-zinc-800/70" />
        ) : (
          <h3 className="mt-1 text-3xl font-bold text-zinc-100">{value}</h3>
        )}
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
