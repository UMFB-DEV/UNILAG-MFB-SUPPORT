"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DEMO_NOTIFICATIONS,
  DEMO_USERS,
  type User,
  type Role,
  type Ticket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/helpdesk/demoData";

import { AdminDashboardCanvas } from "./components/admin-dashboard-canvas";
import { ObsidianShell } from "./components/obsidian-shell";
import { type MainView } from "./components/obsidian-types";
import { ObsidianCard } from "./components/obsidian-ui";
import { TicketDetailModal } from "./components/ticket-detail-modal";
import { TicketTable } from "./components/ticket-table";

import { useAuthStore } from "@/stores/authStore";
import {
  useCreateTicketMutation,
  useDepartmentTicketsQuery,
  useTakeTicketMutation,
  useTicketsQuery,
  useUpdateTicketStatusMutation,
} from "@/services/tickets/hooks";
import { useDepartmentsQuery } from "@/services/departments/hooks";
import { useForgotPasswordMutation } from "@/services/auth/hooks";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  agent: "Support Agent",
  user: "User",
};

function defaultView(role: Role): MainView {
  if (role === "admin") return "dashboard";
  if (role === "agent") return "tickets";
  return "my-tickets";
}

export function HelpdeskPro({
  initialUser,
}: {
  initialUser: { id: number; email: string; name: string; role: Role };
}) {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const token = useAuthStore((s) => s.token);
  const apiUser = useAuthStore((s) => s.user);
  const [users] = useState(DEMO_USERS);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications] = useState(DEMO_NOTIFICATIONS);
  const [view, setView] = useState<MainView>(defaultView(initialUser.role));
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const effectiveRole = (apiUser?.role as Role | undefined) ?? initialUser.role;

  const assignedTicketsQuery = useTicketsQuery({ token, enabled: Boolean(token) });
  const departmentTicketsQuery = useDepartmentTicketsQuery({
    token,
    enabled: Boolean(token) && effectiveRole === "agent" && view === "tickets",
  });

  const ticketsQuery = effectiveRole === "agent" && view === "tickets" ? departmentTicketsQuery : assignedTicketsQuery;

  const createTicketMutation = useCreateTicketMutation({ token });
  const [createTicketError, setCreateTicketError] = useState<string | null>(null);
  const [showCreateTicketSuccess, setShowCreateTicketSuccess] = useState(false);

  const takeTicketMutation = useTakeTicketMutation({ token });
  const [takeTicketError, setTakeTicketError] = useState<string | null>(null);

  const updateTicketStatusMutation = useUpdateTicketStatusMutation({ token });
  const [updateTicketStatusError, setUpdateTicketStatusError] = useState<string | null>(null);

  const departmentsQuery = useDepartmentsQuery({ enabled: view === "new-ticket" });

  const forgotPasswordMutation = useForgotPasswordMutation();
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);

  function emailToId(email: string) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = (hash * 31 + email.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) || 1;
  }

  const apiUsers = useMemo(() => {
    const byEmail = new Map<string, User>();

    function upsert(email: string, role: Role, name?: string | null) {
      const key = email.toLowerCase();
      if (byEmail.has(key)) return;
      const fallbackName = email.split("@")[0] || email;
      byEmail.set(key, {
        id: emailToId(key),
        email,
        role,
        name: name ?? fallbackName,
        color: role === "admin" ? "#4F46E5" : role === "agent" ? "#10B981" : "#EF4444",
      });
    }

    if (apiUser) {
      upsert(apiUser.email, (apiUser.role as Role) ?? "user", apiUser.name);
    }

    upsert(initialUser.email, initialUser.role, initialUser.name);

    const apiTickets = ticketsQuery.data?.data ?? [];
    for (const t of apiTickets) {
      upsert(t.createdBy.email, (t.createdBy.role as Role) ?? "user", t.createdBy.name ?? null);
      if (t.assignedTo?.email) {
        upsert(t.assignedTo.email, (t.assignedTo.role as Role) ?? "agent", t.assignedTo.name ?? null);
      }
    }

    return Array.from(byEmail.values());
  }, [ticketsQuery.data, apiUser, initialUser]);

  const mappedApiTickets = useMemo(() => {
    const apiTickets = ticketsQuery.data?.data ?? [];

    const statusMap: Record<(typeof apiTickets)[number]["status"], TicketStatus> = {
      open: "Open",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    };

    const priorityMap: Record<(typeof apiTickets)[number]["priority"], TicketPriority> = {
      low: "Low",
      medium: "Medium",
      high: "High",
    };

    function getUserId(email: string) {
      return emailToId(email.toLowerCase());
    }

    return apiTickets.map((t) => {
      const created = Date.parse(t.createdAt);
      const updated = Number.isFinite(created) ? created : Date.now();
      const createdById = getUserId(t.createdBy.email);
      const assignedToId = t.assignedTo?.email ? getUserId(t.assignedTo.email) : null;

      const status = statusMap[t.status];
      const priority = priorityMap[t.priority];
      const category = t.category;

      return {
        id: t.id,
        title: t.title,
        desc: t.description,
        category,
        priority,
        status,
        createdBy: createdById,
        assignedTo: assignedToId,
        created: updated,
        updated,
        comments: [],
      } satisfies Ticket;
    });
  }, [ticketsQuery.data]);

  useEffect(() => {
    if (!ticketsQuery.isSuccess) return;
    setTickets(mappedApiTickets);
  }, [ticketsQuery.isSuccess, mappedApiTickets]);

  const [newTicket, setNewTicket] = useState({
    title: "",
    desc: "",
    department: "",
    priority: "Medium" as TicketPriority,
  });

  const currentUser = useMemo(
    () => {
      const fallbackId = emailToId(initialUser.email.toLowerCase());
      const fallback = users.find((u) => u.id === fallbackId) ?? {
        id: fallbackId,
        name: initialUser.name,
        email: initialUser.email,
        role: initialUser.role,
        color: "#D4A373",
      };
      if (!apiUser) return fallback;
      // Prefer API user name/email, but keep demo role/color for UI compatibility
      return {
        ...fallback,
        id: emailToId(apiUser.email.toLowerCase()),
        name: apiUser.name ?? apiUser.email.split("@")[0],
        email: apiUser.email,
        role: apiUser.role as Role,
      };
    },
    [users, initialUser, apiUser],
  );

  const canManage = currentUser.role === "admin" || currentUser.role === "agent";
  const nav = useMemo(() => {
    if (currentUser.role === "admin") {
      return [
        { id: "dashboard" as const, label: "Dashboard" },
        { id: "tickets" as const, label: "Tickets" },
        { id: "new-ticket" as const, label: "New Ticket" },
        { id: "settings" as const, label: "Settings" },
      ];
    }
    if (currentUser.role === "agent") {
      return [
        { id: "tickets" as const, label: "Tickets" },
        { id: "new-ticket" as const, label: "New Ticket" },
        { id: "settings" as const, label: "Settings" },
      ];
    }
    return [
      { id: "my-tickets" as const, label: "My Tickets" },
      { id: "new-ticket" as const, label: "New Ticket" },
      { id: "settings" as const, label: "Settings" },
    ];
  }, [currentUser.role]);

  const visibleTickets = useMemo(() => {
    const scoped =
      currentUser.role === "user"
        ? tickets.filter((t) => t.createdBy === currentUser.id)
        : tickets;

    if (!search.trim()) return scoped;
    const q = search.toLowerCase();
    return scoped.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q),
    );
  }, [tickets, currentUser, search]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  );

  const stats = useMemo(() => {
    const scoped =
      currentUser.role === "user"
        ? tickets.filter((t) => t.createdBy === currentUser.id)
        : tickets;
    const open = scoped.filter((t) => t.status === "Open").length;
    const progress = scoped.filter((t) => t.status === "In Progress").length;
    const resolved = scoped.filter((t) => t.status === "Resolved").length;
    const closed = scoped.filter((t) => t.status === "Closed").length;
    return { total: scoped.length, open, progress, resolved, closed };
  }, [tickets, currentUser]);

  async function createTicket() {
    setCreateTicketError(null);
    if (createTicketMutation.isPending) return;
    const title = newTicket.title.trim();
    const desc = newTicket.desc.trim();
    const department = newTicket.department.trim();
    if (!title || !desc || !department) return;

    const priorityMap: Record<TicketPriority, "low" | "medium" | "high"> = {
      Low: "low",
      Medium: "medium",
      High: "high",
    };

    try {
      await createTicketMutation.mutateAsync({
        title,
        description: desc,
        category: department,
        priority: priorityMap[newTicket.priority],
      });

      setNewTicket({ title: "", desc: "", department: "", priority: "Medium" });
      setShowCreateTicketSuccess(true);
    } catch (e) {
      if (e && typeof e === "object") {
        const maybe = e as { status?: unknown; message?: unknown };
        const status = typeof maybe.status === "number" ? maybe.status : null;
        const message = typeof maybe.message === "string" ? maybe.message : null;
        setCreateTicketError(
          status && status >= 500
            ? "Something went wrong. Please try again."
            : message ?? "Something went wrong. Please try again.",
        );
        return;
      }
      setCreateTicketError("Something went wrong. Please try again.");
    }
  }

  async function takeTicket(ticketId: string) {
    setTakeTicketError(null);
    try {
      await takeTicketMutation.mutateAsync({ ticketId });
    } catch (e) {
      if (e && typeof e === "object") {
        const maybe = e as { status?: unknown; message?: unknown };
        const status = typeof maybe.status === "number" ? maybe.status : null;
        const message = typeof maybe.message === "string" ? maybe.message : null;
        setTakeTicketError(
          status && status >= 500
            ? "Something went wrong. Please try again."
            : message ?? "Something went wrong. Please try again.",
        );
        return;
      }
      setTakeTicketError("Something went wrong. Please try again.");
    }
  }

  async function updateTicketStatus(id: string, status: TicketStatus) {
    setUpdateTicketStatusError(null);

    const ticket = tickets.find((t) => t.id === id) ?? null;
    if (!ticket) return;

    const statusOrder: Record<TicketStatus, number> = {
      Open: 0,
      "In Progress": 1,
      Resolved: 2,
      Closed: 3,
    };

    if (statusOrder[status] < statusOrder[ticket.status]) {
      setUpdateTicketStatusError(`Cannot revert status from ${ticket.status} to ${status}.`);
      return;
    }

    if (currentUser.role === "agent" && ticket.assignedTo !== currentUser.id) {
      setUpdateTicketStatusError("You can only update tickets assigned to you.");
      return;
    }

    const statusMap: Record<TicketStatus, "open" | "in_progress" | "resolved" | "closed"> = {
      Open: "open",
      "In Progress": "in_progress",
      Resolved: "resolved",
      Closed: "closed",
    };

    try {
      await updateTicketStatusMutation.mutateAsync({
        ticketId: id,
        input: { status: statusMap[status] },
      });
    } catch (e) {
      if (e && typeof e === "object") {
        const maybe = e as { status?: unknown; message?: unknown };
        const s = typeof maybe.status === "number" ? maybe.status : null;
        const message = typeof maybe.message === "string" ? maybe.message : null;

        if (s === 400 && statusOrder[status] < statusOrder[ticket.status]) {
          setUpdateTicketStatusError(`Cannot revert status from ${ticket.status} to ${status}.`);
          return;
        }

        setUpdateTicketStatusError(
          s && s >= 500
            ? "Something went wrong. Please try again."
            : message ?? "Something went wrong. Please try again.",
        );
        return;
      }
      setUpdateTicketStatusError("Something went wrong. Please try again.");
    }
  }

  function addComment(id: string, text: string, internal: boolean) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              updated: Date.now(),
              comments: [
                ...t.comments,
                {
                  id: Date.now(),
                  author: currentUser.id,
                  text,
                  type: internal ? "internal" : "public",
                  time: Date.now(),
                },
              ],
            }
          : t,
      ),
    );
  }

  async function signOut() {
    clearAuth();
    window.location.href = "/dashboard/login";
  }

  return (
    <ObsidianShell
      name={currentUser.name}
      roleLabel={ROLE_LABEL[currentUser.role]}
      activeView={view}
      nav={nav}
      onNavigate={setView}
      onSignOut={signOut}
      showNewTicketAction
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">
            {view === "dashboard"
              ? "Archive Overview"
              : view === "tickets" || view === "my-tickets"
                ? "Tickets"
                : view === "new-ticket"
                  ? "Create New Ticket"
                  : "Settings"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {currentUser.role === "user" && view === "my-tickets"
              ? "All tickets created by you (past and present)"
              : "Obsidian support workspace"}
          </p>
        </div>
        {(view === "tickets" || view === "my-tickets") && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full max-w-xs rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#D4A373]"
          />
        )}
      </div>

      {view === "dashboard" && currentUser.role === "admin" && (
        <AdminDashboardCanvas stats={stats} tickets={tickets} users={users} />
      )}

      {(view === "tickets" || view === "my-tickets") && (
        <ObsidianCard title={view === "my-tickets" ? "My Tickets" : "Tickets"} subtitle="Click a row to open ticket detail">
          {ticketsQuery.isLoading ? (
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
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#1F1F21]">
                      <td className="px-3 py-4">
                        <div className="h-4 w-16 rounded bg-zinc-800/70" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 w-56 rounded bg-zinc-800/70" />
                        <div className="mt-2 h-3 w-28 rounded bg-zinc-800/50" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 w-32 rounded bg-zinc-800/50" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 w-20 rounded-full bg-zinc-800/70" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 w-20 rounded-full bg-zinc-800/70" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 w-24 rounded bg-zinc-800/70" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 w-16 rounded bg-zinc-800/50" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : visibleTickets.length === 0 ? (
            <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] p-8 text-center">
              <p className="text-sm font-semibold text-zinc-100">
                {effectiveRole === "agent" && view === "tickets" ? "No department tickets yet" : "No tickets yet"}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {effectiveRole === "agent" && view === "tickets"
                  ? "Tickets created in your department will show up here."
                  : "When you create a ticket, it will show up here with its status and updates."}
              </p>
              {effectiveRole === "agent" && view === "tickets" ? null : (
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => setView("new-ticket")}
                    className="rounded-lg bg-[#D4A373] px-5 py-2 text-sm font-semibold text-[#111111]"
                    type="button"
                  >
                    Create your first ticket
                  </button>
                </div>
              )}
            </div>
          ) : (
            <TicketTable tickets={visibleTickets} users={apiUsers} onOpen={setSelectedTicketId} />
          )}
        </ObsidianCard>
      )}

      {view === "new-ticket" && (
        <ObsidianCard title="New Ticket" subtitle="Submit a request to the support archive">
          <div className="space-y-4">
            {createTicketError ? (
              <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                {createTicketError}
              </div>
            ) : null}
            {createTicketMutation.isPending ? (
              <p className="text-xs text-zinc-500">Submitting ticket...</p>
            ) : null}
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">Title</label>
              <input
                value={newTicket.title}
                onChange={(e) => setNewTicket((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#D4A373]"
                placeholder="Brief issue title"
                disabled={createTicketMutation.isPending}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">Department</label>
                <select
                  value={newTicket.department}
                  onChange={(e) => setNewTicket((p) => ({ ...p, department: e.target.value }))}
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#D4A373]"
                  disabled={
                    createTicketMutation.isPending ||
                    departmentsQuery.isLoading ||
                    !departmentsQuery.data?.data?.length
                  }
                >
                  <option value="" disabled>
                    {departmentsQuery.isLoading
                      ? "Loading departments..."
                      : departmentsQuery.isError
                        ? "Failed to load departments"
                        : "Select department"}
                  </option>
                  {(departmentsQuery.data?.data ?? []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) =>
                    setNewTicket((p) => ({ ...p, priority: e.target.value as TicketPriority }))
                  }
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#D4A373]"
                  disabled={createTicketMutation.isPending}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">Description</label>
              <textarea
                value={newTicket.desc}
                onChange={(e) => setNewTicket((p) => ({ ...p, desc: e.target.value }))}
                rows={7}
                className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#D4A373]"
                placeholder="Describe your issue in detail"
                disabled={createTicketMutation.isPending}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={createTicket}
                className="rounded-lg bg-[#D4A373] px-5 py-2 text-sm font-semibold text-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </div>
        </ObsidianCard>
      )}

      {view === "settings" && (
        <div className="grid gap-4 md:grid-cols-2">
          <ObsidianCard title="Profile">
            <div className="space-y-3 text-sm text-zinc-300">
              <p>
                <span className="text-zinc-500">Name:</span> {currentUser.name}
              </p>
              <p>
                <span className="text-zinc-500">Email:</span> {currentUser.email}
              </p>
              <p>
                <span className="text-zinc-500">Role:</span> {ROLE_LABEL[currentUser.role]}
              </p>
            </div>
          </ObsidianCard>
          <ObsidianCard title="Security" subtitle="Password & account safety">
            <div className="space-y-3">
              {resetPasswordError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                  {resetPasswordError}
                </div>
              ) : null}
              {resetPasswordSuccess ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">
                  {resetPasswordSuccess}
                </div>
              ) : null}
              <p className="text-sm text-zinc-500">
                We’ll email you a password reset link. The link expires after 60 minutes.
              </p>
              <button
                type="button"
                className="w-full rounded-lg bg-[#D4A373] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#111111] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={forgotPasswordMutation.isPending}
                onClick={async () => {
                  setResetPasswordError(null);
                  setResetPasswordSuccess(null);
                  try {
                    const res = await forgotPasswordMutation.mutateAsync({ email: currentUser.email });
                    setResetPasswordSuccess(
                      res.message || "If an account exists for that email, a reset link has been sent.",
                    );
                  } catch (e) {
                    if (e && typeof e === "object") {
                      const maybe = e as { status?: unknown; message?: unknown };
                      const status = typeof maybe.status === "number" ? maybe.status : null;
                      const message = typeof maybe.message === "string" ? maybe.message : null;
                      setResetPasswordError(
                        status && status >= 500
                          ? "Something went wrong. Please try again."
                          : message ?? "Something went wrong. Please try again.",
                      );
                      return;
                    }
                    setResetPasswordError("Something went wrong. Please try again.");
                  }
                }}
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Send reset link"}
              </button>
            </div>
          </ObsidianCard>
          <ObsidianCard title="Notifications">
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-lg border border-[#1F1F21] bg-[#0F0F10] p-3">
                  <p className="text-sm font-semibold text-zinc-100">{n.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{n.desc}</p>
                </div>
              ))}
            </div>
          </ObsidianCard>
        </div>
      )}

      {selectedTicket ? (
        <TicketDetailModal
          ticket={selectedTicket}
          token={token}
          users={apiUsers}
          canComment={
            selectedTicket.status !== "Closed" &&
            (currentUser.role === "admin" ||
              (currentUser.role === "agent" && selectedTicket.assignedTo === currentUser.id) ||
              (currentUser.role === "user" && selectedTicket.createdBy === currentUser.id))
          }
          canInternalComment={currentUser.role === "admin" || currentUser.role === "agent"}
          canTakeTicket={currentUser.role === "agent" && selectedTicket.status === "Open" && !selectedTicket.assignedTo}
          takeTicketError={takeTicketError}
          takeTicketPending={takeTicketMutation.isPending}
          onTakeTicket={takeTicket}
          canUpdateStatus={
            currentUser.role === "admin" ||
            (currentUser.role === "agent" && selectedTicket.assignedTo === currentUser.id)
          }
          updateStatusError={updateTicketStatusError}
          updateStatusPending={updateTicketStatusMutation.isPending}
          onClose={() => setSelectedTicketId(null)}
          onUpdateStatus={updateTicketStatus}
        />
      ) : null}

      {showCreateTicketSuccess ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-md rounded-xl border border-[#1F1F21] bg-[#111111] p-8 shadow-2xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4A373]/20">
                <svg
                  className="h-6 w-6 text-[#D4A373]"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100">Ticket Submitted</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Your ticket has been created successfully.
              </p>
            </div>
            <button
              className="w-full rounded-lg bg-[#D4A373] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#111111] hover:brightness-110"
              onClick={() => {
                setShowCreateTicketSuccess(false);
                setView(currentUser.role === "user" ? "my-tickets" : "tickets");
              }}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}
    </ObsidianShell>
  );
}

