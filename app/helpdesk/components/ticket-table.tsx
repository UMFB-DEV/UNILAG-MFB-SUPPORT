import type { Ticket, TicketPriority, TicketStatus, User } from "@/lib/helpdesk/demoData";

import { StatusPill } from "./obsidian-ui";

function toneFromStatus(status: TicketStatus): "open" | "progress" | "resolved" | "closed" {
  if (status === "Open") return "open";
  if (status === "In Progress") return "progress";
  if (status === "Resolved") return "resolved";
  return "closed";
}

function toneFromPriority(priority: TicketPriority): "high" | "medium" | "low" {
  if (priority === "High") return "high";
  if (priority === "Medium") return "medium";
  return "low";
}

function ago(ts: number) {
  const d = Date.now() - ts;
  if (d < 3_600_000) return `${Math.max(1, Math.floor(d / 60_000))}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

function shortId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function TicketTable({
  tickets,
  users,
  onOpen,
  canAssign,
  assignOptionsByTicketId,
  onAssign,
  assigningTicketId,
  onDelete,
  deletingTicketId,
}: {
  tickets: Ticket[];
  users: User[];
  onOpen: (id: string) => void;
  canAssign?: boolean;
  assignOptionsByTicketId?: Record<string, { id: string; name: string; email: string }[]>;
  onAssign?: (ticketId: string, assignedToId: string) => void;
  assigningTicketId?: string | null;
  onDelete?: (ticketId: string) => void;
  deletingTicketId?: string | null;
}) {
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-[#1F1F21] text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          <tr>
            <th className="px-3 py-3">ID</th>
            <th className="px-3 py-3">Title</th>
            <th className="px-3 py-3">Department</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Priority</th>
            <th className="px-3 py-3">Assignee</th>
            <th className="px-3 py-3">Updated</th>
            {onDelete ? <th className="px-3 py-3 text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              className="cursor-pointer border-b border-[#1F1F21] hover:bg-[#1A1A1A]"
              onClick={() => onOpen(t.id)}
            >
              <td className="px-3 py-4 font-mono text-xs text-[#D4A373]" title={t.id}>
                {shortId(t.id)}
              </td>
              <td className="px-3 py-4">
                <p className="font-semibold text-zinc-100">{t.title}</p>
              </td>
              <td className="px-3 py-4 text-zinc-300">{t.category}</td>
              <td className="px-3 py-4">
                <StatusPill tone={toneFromStatus(t.status)} label={t.status} />
              </td>
              <td className="px-3 py-4">
                <StatusPill tone={toneFromPriority(t.priority)} label={t.priority} />
              </td>
              <td className="px-3 py-4 text-zinc-300">
                {t.assignedTo ? (
                  userMap.get(t.assignedTo) ?? "Unknown"
                ) : canAssign && assignOptionsByTicketId && onAssign ? (
                  <select
                    className="w-full max-w-[220px] rounded-lg border border-[#2A2A2C] bg-[#111111] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#D4A373]"
                    disabled={
                      assigningTicketId === t.id ||
                      !assignOptionsByTicketId[t.id] ||
                      assignOptionsByTicketId[t.id].length === 0
                    }
                    value=""
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (!next) return;
                      e.currentTarget.value = "";
                      onAssign(t.id, next);
                    }}
                  >
                    <option value="" disabled>
                      {assignOptionsByTicketId[t.id] && assignOptionsByTicketId[t.id].length > 0
                        ? assigningTicketId === t.id
                          ? "Assigning..."
                          : "Assign agent"
                        : "No agents"}
                    </option>
                    {(assignOptionsByTicketId[t.id] ?? []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-zinc-500">Unassigned</span>
                )}
              </td>
              <td className="px-3 py-4 text-zinc-500">{ago(t.updated)}</td>
              {onDelete ? (
                <td className="px-3 py-4 text-right">
                  <button
                    type="button"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                    disabled={deletingTicketId === t.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(t.id);
                    }}
                  >
                    {deletingTicketId === t.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

