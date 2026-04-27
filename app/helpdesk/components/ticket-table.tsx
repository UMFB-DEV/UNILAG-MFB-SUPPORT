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
}: {
  tickets: Ticket[];
  users: User[];
  onOpen: (id: string) => void;
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
                {t.assignedTo ? userMap.get(t.assignedTo) ?? "Unknown" : <span className="text-zinc-500">Unassigned</span>}
              </td>
              <td className="px-3 py-4 text-zinc-500">{ago(t.updated)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

