"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DEMO_NOTIFICATIONS,
  type User,
  type Role,
  type Ticket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/helpdesk/demoData";

import { AdminDashboardCanvas, AgentPerformanceTable } from "./components/admin-dashboard-canvas";
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
import { useForgotPasswordMutation, useUpdateProfileMutation } from "@/services/auth/hooks";
import { useCreateUserMutation, useUpdateUserDepartmentMutation, useUpdateUserRoleMutation, useUsersQuery } from "@/services/users/hooks";
import { useReportsSummaryQuery } from "@/services/reports/hooks";

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
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const apiUser = useAuthStore((s) => s.user);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications] = useState(DEMO_NOTIFICATIONS);
  const [view, setView] = useState<MainView>(defaultView(initialUser.role));
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [usersSearch, setUsersSearch] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const usersLimit = 10;

  const [roleChange, setRoleChange] = useState<{
    userId: string;
    name: string;
    email: string;
    from: "user" | "agent" | "admin";
    to: "user" | "agent" | "admin";
  } | null>(null);

  const [deptChange, setDeptChange] = useState<{
    userId: string;
    name: string;
    email: string;
    from: string | null;
    to: string | null;
  } | null>(null);

  const effectiveRole = (apiUser?.role as Role | undefined) ?? initialUser.role;

  const ticketListParams =
    view === "tickets" || view === "my-tickets"
      ? {
          page,
          limit,
          keyword: search.trim() ? search.trim() : undefined,
        }
      : undefined;

  const ticketsListEnabled = Boolean(token) && (view === "tickets" || view === "my-tickets" || effectiveRole !== "admin");

  const assignedTicketsQuery = useTicketsQuery({
    token,
    enabled: ticketsListEnabled,
    params: ticketListParams,
  });
  const departmentTicketsQuery = useDepartmentTicketsQuery({
    token,
    params: ticketListParams,
    enabled: ticketsListEnabled && effectiveRole === "agent" && view === "tickets",
  });

  const ticketsQuery = effectiveRole === "agent" && view === "tickets" ? departmentTicketsQuery : assignedTicketsQuery;

  const reportsSummaryQuery = useReportsSummaryQuery({
    token,
    enabled: Boolean(token) && effectiveRole === "admin" && view === "dashboard",
  });
  const adminUsersQuery = useUsersQuery({
    token,
    enabled:
      Boolean(token) &&
      effectiveRole === "admin" &&
      (view === "dashboard" || view === "agents" || view === "users"),
  });
  const adminTicketsQuery = useTicketsQuery({
    token,
    enabled: Boolean(token) && effectiveRole === "admin" && view === "dashboard",
    params: { page: 1, limit: 100 },
  });

  const updateUserRoleMutation = useUpdateUserRoleMutation({ token });
  const updateUserDepartmentMutation = useUpdateUserDepartmentMutation({ token });
  const createUserMutation = useCreateUserMutation({ token });

  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentDepartment, setNewAgentDepartment] = useState<string | null>(null);
  const [createAgentSuccess, setCreateAgentSuccess] = useState<string | null>(null);

  const adminDepartmentsQuery = useDepartmentsQuery({
    enabled: (view === "users" || view === "create-agent") && effectiveRole === "admin",
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!(effectiveRole === "admin" && view === "dashboard")) return;
    if (reportsSummaryQuery.isSuccess) {
      // eslint-disable-next-line no-console
      console.log("[admin dashboard] reportsSummaryQuery success", reportsSummaryQuery.data);
    }
  }, [effectiveRole, view, reportsSummaryQuery.isSuccess, reportsSummaryQuery.data]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!(effectiveRole === "admin" && view === "dashboard")) return;
    if (reportsSummaryQuery.isError) {
      // eslint-disable-next-line no-console
      console.error(
        "[admin dashboard] reportsSummaryQuery error",
        reportsSummaryQuery.error,
        reportsSummaryQuery.data,
      );
    }
  }, [effectiveRole, view, reportsSummaryQuery.isError, reportsSummaryQuery.error, reportsSummaryQuery.data]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!(effectiveRole === "admin" && view === "dashboard")) return;
    if (adminUsersQuery.isSuccess) {
      // eslint-disable-next-line no-console
      console.log("[admin dashboard] adminUsersQuery success", adminUsersQuery.data);
    }
  }, [effectiveRole, view, adminUsersQuery.isSuccess, adminUsersQuery.data]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!(effectiveRole === "admin" && view === "dashboard")) return;
    if (adminUsersQuery.isError) {
      // eslint-disable-next-line no-console
      console.error(
        "[admin dashboard] adminUsersQuery error",
        adminUsersQuery.error,
        adminUsersQuery.data,
      );
    }
  }, [effectiveRole, view, adminUsersQuery.isError, adminUsersQuery.error, adminUsersQuery.data]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!(effectiveRole === "admin" && view === "dashboard")) return;
    if (adminTicketsQuery.isError) {
      // eslint-disable-next-line no-console
      console.error(
        "[admin dashboard] adminTicketsQuery error",
        adminTicketsQuery.error,
        adminTicketsQuery.data,
      );
    }
  }, [effectiveRole, view, adminTicketsQuery.isError, adminTicketsQuery.error, adminTicketsQuery.data]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!(effectiveRole === "admin" && view === "dashboard")) return;
    if (adminTicketsQuery.isSuccess) {
      // eslint-disable-next-line no-console
      console.log("[admin dashboard] adminTicketsQuery success", adminTicketsQuery.data);
    }
  }, [effectiveRole, view, adminTicketsQuery.isSuccess, adminTicketsQuery.data]);

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

  const updateProfileMutation = useUpdateProfileMutation({ token });
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [updateProfileError, setUpdateProfileError] = useState<string | null>(null);
  const [updateProfileSuccess, setUpdateProfileSuccess] = useState<string | null>(null);

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
      const updatedRaw = t.updatedAt ? Date.parse(t.updatedAt) : NaN;
      const updated = Number.isFinite(updatedRaw) ? updatedRaw : Number.isFinite(created) ? created : Date.now();
      const resolvedRaw = t.resolvedAt ? Date.parse(t.resolvedAt) : NaN;
      const resolvedAt = Number.isFinite(resolvedRaw) ? resolvedRaw : undefined;
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
        created: Number.isFinite(created) ? created : updated,
        updated,
        resolvedAt,
        comments: [],
      } satisfies Ticket;
    });
  }, [ticketsQuery.data]);

  const adminMappedTickets = useMemo(() => {
    const apiTickets = adminTicketsQuery.data?.data ?? [];

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
      const updatedRaw = t.updatedAt ? Date.parse(t.updatedAt) : NaN;
      const updated = Number.isFinite(updatedRaw) ? updatedRaw : Number.isFinite(created) ? created : Date.now();
      const resolvedRaw = t.resolvedAt ? Date.parse(t.resolvedAt) : NaN;
      const resolvedAt = Number.isFinite(resolvedRaw) ? resolvedRaw : undefined;
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
        created: Number.isFinite(created) ? created : updated,
        updated,
        resolvedAt,
        comments: [],
      } satisfies Ticket;
    });
  }, [adminTicketsQuery.data]);

  useEffect(() => {
    if (!ticketsQuery.isSuccess) return;
    setTickets(mappedApiTickets);
  }, [ticketsQuery.isSuccess, mappedApiTickets]);

  useEffect(() => {
    setPage(1);
  }, [search, view]);

  useEffect(() => {
    const totalPages = ticketsQuery.data?.meta?.totalPages;
    if (!totalPages || totalPages < 1) return;
    if (page > totalPages) setPage(totalPages);
  }, [ticketsQuery.data?.meta?.totalPages, page]);

  const [newTicket, setNewTicket] = useState({
    title: "",
    desc: "",
    department: "",
    priority: "Medium" as TicketPriority,
  });

  const currentUser = useMemo(
    () => {
      const fallbackId = emailToId(initialUser.email.toLowerCase());
      const fallback = {
        id: fallbackId,
        name: initialUser.name,
        email: initialUser.email,
        role: initialUser.role,
        color: initialUser.role === "admin" ? "#4F46E5" : initialUser.role === "agent" ? "#10B981" : "#EF4444",
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
    [initialUser, apiUser],
  );

  useEffect(() => {
    if (view !== "settings") return;
    setProfileName(apiUser?.name ?? initialUser.name);
    setProfileEmail(apiUser?.email ?? initialUser.email);
  }, [view, apiUser?.name, apiUser?.email, initialUser.name, initialUser.email]);

  const canManage = currentUser.role === "admin" || currentUser.role === "agent";
  const nav = useMemo(() => {
    if (currentUser.role === "admin") {
      return [
        { id: "dashboard" as const, label: "Dashboard" },
        { id: "agents" as const, label: "All Agents" },
        { id: "users" as const, label: "All Users" },
        { id: "create-agent" as const, label: "Create Agent" },
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

    return scoped;
  }, [tickets, currentUser]);

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

  const adminStats = useMemo(() => {
    const scoped = adminMappedTickets;
    const open = scoped.filter((t) => t.status === "Open").length;
    const progress = scoped.filter((t) => t.status === "In Progress").length;
    const resolved = scoped.filter((t) => t.status === "Resolved").length;
    const closed = scoped.filter((t) => t.status === "Closed").length;
    return { total: scoped.length, open, progress, resolved, closed };
  }, [adminMappedTickets]);

  const adminDashboardStats = useMemo(() => {
    const summary = reportsSummaryQuery.data?.data;
    if (!summary) return adminStats;

    const progress = adminMappedTickets.filter((t) => t.status === "In Progress").length;
    const resolved = adminMappedTickets.filter((t) => t.status === "Resolved").length;

    return {
      total: summary.totalTickets,
      open: summary.openTickets,
      progress,
      resolved,
      closed: summary.closedTickets,
    };
  }, [adminStats, adminMappedTickets, reportsSummaryQuery.data?.data]);

  const adminUsers = useMemo(() => {
    const raw = adminUsersQuery.data?.data ?? [];
    return raw.map((u) => {
      const role = (u.role === "admin" || u.role === "agent" || u.role === "user") ? u.role : "user";
      return {
        id: emailToId(u.email.toLowerCase()),
        name: u.name ?? u.email.split("@")[0],
        email: u.email,
        role,
        color: role === "admin" ? "#4F46E5" : role === "agent" ? "#10B981" : "#EF4444",
      } satisfies User;
    });
  }, [adminUsersQuery.data]);

  const adminAgents = useMemo(
    () => adminUsers.filter((u) => u.role === "agent"),
    [adminUsers],
  );

  const adminAgentsRaw = useMemo(
    () => (adminUsersQuery.data?.data ?? []).filter((u) => u.role === "agent"),
    [adminUsersQuery.data?.data],
  );

  const adminUsersRawFiltered = useMemo(() => {
    const raw = adminUsersQuery.data?.data ?? [];
    const q = usersSearch.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((u) => {
      const parts = [u.name, u.email, u.role, u.department ?? "", u.createdAt ?? ""];
      return parts.some((p) => String(p).toLowerCase().includes(q));
    });
  }, [adminUsersQuery.data?.data, usersSearch]);

  const usersTotalPages = useMemo(
    () => Math.max(1, Math.ceil(adminUsersRawFiltered.length / usersLimit)),
    [adminUsersRawFiltered.length],
  );

  useEffect(() => {
    setUsersPage(1);
  }, [usersSearch]);

  useEffect(() => {
    setUsersPage((p) => Math.min(Math.max(1, p), usersTotalPages));
  }, [usersTotalPages]);

  const adminUsersRawPage = useMemo(() => {
    const start = (usersPage - 1) * usersLimit;
    return adminUsersRawFiltered.slice(start, start + usersLimit);
  }, [adminUsersRawFiltered, usersPage]);

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
              ? "unilag-mfb-support"
              : view === "agents"
                ? "All Agents"
                : view === "users"
                  ? "All Users"
                  : view === "create-agent"
                    ? "Create Agent"
              : view === "tickets" || view === "my-tickets"
                ? "Tickets"
                : view === "new-ticket"
                  ? "New Ticket"
                  : "Settings"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {currentUser.role === "user" && view === "my-tickets"
              ? "All tickets created by you (past and present)"
              : "unilag-mfb-support"}
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

        {view === "users" && currentUser.role === "admin" && (
          <input
            value={usersSearch}
            onChange={(e) => setUsersSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full max-w-xs rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#D4A373]"
          />
        )}
      </div>

      {view === "dashboard" && currentUser.role === "admin" && (
        reportsSummaryQuery.isError || adminUsersQuery.isError ? (
          <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] p-6 text-sm text-zinc-300">
            Failed to load admin dashboard.
          </div>
        ) : reportsSummaryQuery.isLoading || adminUsersQuery.isLoading ? (
          <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] p-6 text-sm text-zinc-300">
            Loading dashboard...
          </div>
        ) : (
          <div className="space-y-4">
            {adminTicketsQuery.isError ? (
              <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] px-4 py-3 text-xs text-zinc-400">
                Ticket metrics are temporarily unavailable.
              </div>
            ) : null}
            <AdminDashboardCanvas
              stats={adminDashboardStats}
              tickets={adminMappedTickets ?? []}
              users={adminUsers}
              averageResolutionHours={reportsSummaryQuery.data?.data?.averageResolutionHours ?? null}
              closedTickets={reportsSummaryQuery.data?.data?.closedTickets ?? 0}
              onViewAllAgents={() => setView("agents")}
            />
          </div>
        )
      )}

      {view === "agents" && currentUser.role === "admin" && (
        adminUsersQuery.isError ? (
          <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] p-6 text-sm text-zinc-300">
            Failed to load agents.
          </div>
        ) : adminUsersQuery.isLoading ? (
          <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] p-6 text-sm text-zinc-300">
            Loading agents...
          </div>
        ) : (
          <AgentPerformanceTable
            tickets={adminMappedTickets ?? []}
            users={adminUsers}
            showViewAllAgentsButton={false}
          />
        )
      )}

      {view === "create-agent" && currentUser.role === "admin" && (
        <ObsidianCard title="Create Agent" subtitle="Create a new support agent in unilag-mfb-support">
          <form
            className="max-w-xl space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setCreateAgentSuccess(null);
              createUserMutation.reset();

              try {
                await createUserMutation.mutateAsync({
                  email: newAgentEmail.trim(),
                  password: newAgentPassword,
                  role: "agent",
                  department: newAgentDepartment,
                });
                setNewAgentEmail("");
                setNewAgentPassword("");
                setNewAgentDepartment(null);
                setCreateAgentSuccess("Agent created successfully.");
              } catch {
                // noop
              }
            }}
          >
            {createAgentSuccess ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                {createAgentSuccess}
              </div>
            ) : null}

            {createUserMutation.isError ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {createUserMutation.error instanceof Error ? createUserMutation.error.message : "Failed to create agent"}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Email</label>
                <input
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  placeholder="agent@company.com"
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#D4A373]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400">Password</label>
                <input
                  value={newAgentPassword}
                  onChange={(e) => setNewAgentPassword(e.target.value)}
                  placeholder="********"
                  type="password"
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#D4A373]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-400">Department</label>
              <select
                className="w-full max-w-[360px] rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#D4A373]"
                value={newAgentDepartment ?? ""}
                disabled={adminDepartmentsQuery.isLoading || adminDepartmentsQuery.isError}
                onChange={(e) => {
                  const next = e.target.value ? e.target.value : null;
                  setNewAgentDepartment(next);
                }}
              >
                <option value="">No department</option>
                {(adminDepartmentsQuery.data?.data ?? []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {adminDepartmentsQuery.isError ? (
                <div className="mt-2 text-xs text-zinc-500">Failed to load departments.</div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-lg border border-[#2A2A2C] bg-[#111111] px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
                disabled={createUserMutation.isPending}
                onClick={() => {
                  setNewAgentEmail("");
                  setNewAgentPassword("");
                  setNewAgentDepartment(null);
                  setCreateAgentSuccess(null);
                  createUserMutation.reset();
                }}
              >
                Clear
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#D4A373] px-4 py-2 text-sm font-semibold text-[#111111] disabled:opacity-50"
                disabled={createUserMutation.isPending || !newAgentEmail.trim() || !newAgentPassword}
              >
                {createUserMutation.isPending ? "Creating..." : "Create Agent"}
              </button>
            </div>
          </form>
        </ObsidianCard>
      )}

      {view === "users" && currentUser.role === "admin" && roleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1F1F21] bg-[#111111] p-6">
            <h3 className="text-lg font-semibold text-zinc-100">Confirm role change</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Change role for <span className="font-semibold text-zinc-200">{roleChange.name}</span> (
              {roleChange.email}) from <span className="font-semibold text-zinc-200">{roleChange.from}</span> to{" "}
              <span className="font-semibold text-zinc-200">{roleChange.to}</span>?
            </p>

            {updateUserRoleMutation.isError ? (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {updateUserRoleMutation.error instanceof Error
                  ? updateUserRoleMutation.error.message
                  : "Failed to update user"}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-[#2A2A2C] bg-[#111111] px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
                disabled={updateUserRoleMutation.isPending}
                onClick={() => {
                  updateUserRoleMutation.reset();
                  setRoleChange(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#D4A373] px-4 py-2 text-sm font-semibold text-[#111111] disabled:opacity-50"
                disabled={updateUserRoleMutation.isPending}
                onClick={async () => {
                  try {
                    await updateUserRoleMutation.mutateAsync({
                      userId: roleChange.userId,
                      role: roleChange.to,
                    });
                    setRoleChange(null);
                  } catch {
                    // noop
                  }
                }}
              >
                {updateUserRoleMutation.isPending ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "users" && currentUser.role === "admin" && deptChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1F1F21] bg-[#111111] p-6">
            <h3 className="text-lg font-semibold text-zinc-100">Confirm department change</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Change department for <span className="font-semibold text-zinc-200">{deptChange.name}</span> (
              {deptChange.email}) from{" "}
              <span className="font-semibold text-zinc-200">{deptChange.from ?? "—"}</span> to{" "}
              <span className="font-semibold text-zinc-200">{deptChange.to ?? "—"}</span>?
            </p>

            {updateUserDepartmentMutation.isError ? (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {updateUserDepartmentMutation.error instanceof Error
                  ? updateUserDepartmentMutation.error.message
                  : "Failed to update department"}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-[#2A2A2C] bg-[#111111] px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
                disabled={updateUserDepartmentMutation.isPending}
                onClick={() => {
                  updateUserDepartmentMutation.reset();
                  setDeptChange(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#D4A373] px-4 py-2 text-sm font-semibold text-[#111111] disabled:opacity-50"
                disabled={updateUserDepartmentMutation.isPending}
                onClick={async () => {
                  try {
                    await updateUserDepartmentMutation.mutateAsync({
                      userId: deptChange.userId,
                      department: deptChange.to,
                    });
                    setDeptChange(null);
                  } catch {
                    // noop
                  }
                }}
              >
                {updateUserDepartmentMutation.isPending ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "users" && currentUser.role === "admin" && (
        adminUsersQuery.isError ? (
          <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] p-6 text-sm text-zinc-300">
            Failed to load users.
          </div>
        ) : adminUsersQuery.isLoading ? (
          <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] p-6 text-sm text-zinc-300">
            Loading users...
          </div>
        ) : (
          <ObsidianCard title="All Users" subtitle="All registered users in unilag-mfb-support">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F21] text-xs text-zinc-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F21]">
                  {adminUsersRawPage.map((u) => (
                    <tr key={u.id} className="text-zinc-200">
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full max-w-[160px] rounded-lg border border-[#2A2A2C] bg-[#111111] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#D4A373]"
                          value={u.role}
                          onChange={(e) => {
                            const nextRole = e.target.value as "user" | "agent" | "admin";
                            e.currentTarget.value = u.role;
                            if (nextRole === u.role) return;
                            setRoleChange({
                              userId: u.id,
                              name: u.name,
                              email: u.email,
                              from: u.role,
                              to: nextRole,
                            });
                          }}
                        >
                          <option value="user">User</option>
                          <option value="agent">Support Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full max-w-[280px] rounded-lg border border-[#2A2A2C] bg-[#111111] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#D4A373]"
                          value={u.department ?? ""}
                          disabled={adminDepartmentsQuery.isLoading || adminDepartmentsQuery.isError}
                          onChange={(e) => {
                            const nextDept = e.target.value ? e.target.value : null;
                            e.currentTarget.value = u.department ?? "";
                            const from = u.department ?? null;
                            if (nextDept === from) return;
                            setDeptChange({
                              userId: u.id,
                              name: u.name,
                              email: u.email,
                              from,
                              to: nextDept,
                            });
                          }}
                        >
                          <option value="">No department</option>
                          {(adminDepartmentsQuery.data?.data ?? []).map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{u.createdAt ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {adminUsersRawFiltered.length === 0 ? (
                <div className="px-4 py-6 text-sm text-zinc-400">No users found.</div>
              ) : (
                <div className="flex items-center justify-between gap-3 px-4 py-4 text-sm text-zinc-300">
                  <button
                    type="button"
                    className="rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-xs text-zinc-200 disabled:opacity-50"
                    disabled={usersPage <= 1}
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <div className="text-xs text-zinc-400">
                    Page {usersPage} of {usersTotalPages}
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-xs text-zinc-200 disabled:opacity-50"
                    disabled={usersPage >= usersTotalPages}
                    onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </ObsidianCard>
        )
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
                {search.trim()
                  ? "No tickets match your search"
                  : effectiveRole === "agent" && view === "tickets"
                    ? "No department tickets yet"
                    : "No tickets yet"}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {search.trim()
                  ? "Try adjusting your search terms or filters."
                  : effectiveRole === "agent" && view === "tickets"
                    ? "Tickets created in your department will show up here."
                    : "When you create a ticket, it will show up here with its status and updates."}
              </p>
              {search.trim() ? (
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => setSearch("")}
                    className="rounded-lg border border-[#1F1F21] bg-transparent px-5 py-2 text-sm font-semibold text-zinc-300 hover:bg-[#1A1A1A]"
                    type="button"
                  >
                    Clear search
                  </button>
                </div>
              ) : effectiveRole === "agent" && view === "tickets" ? null : (
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
            <div className="space-y-4">
              <TicketTable tickets={visibleTickets} users={apiUsers} onOpen={setSelectedTicketId} />
              {ticketsQuery.data?.meta?.totalPages && ticketsQuery.data.meta.totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500">
                    Page {ticketsQuery.data.meta.page} of {ticketsQuery.data.meta.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || ticketsQuery.isFetching}
                      className="rounded-lg border border-[#1F1F21] bg-transparent px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(ticketsQuery.data?.meta?.totalPages ?? p + 1, p + 1),
                        )
                      }
                      disabled={
                        page >= (ticketsQuery.data.meta.totalPages ?? page) ||
                        ticketsQuery.isFetching
                      }
                      className="rounded-lg border border-[#1F1F21] bg-transparent px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
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
          <ObsidianCard title="Profile" subtitle="Update your name or email">
            <div className="space-y-3">
              {updateProfileError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                  {updateProfileError}
                </div>
              ) : null}
              {updateProfileSuccess ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">
                  {updateProfileSuccess}
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">Name</label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  disabled={updateProfileMutation.isPending}
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#D4A373] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  disabled={updateProfileMutation.isPending}
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#D4A373] disabled:opacity-60"
                />
              </div>

              <div className="space-y-2 text-sm text-zinc-300">
                <p>
                  <span className="text-zinc-500">Current role:</span> {ROLE_LABEL[currentUser.role]}
                </p>
              </div>

              <button
                type="button"
                className="w-full rounded-lg bg-[#D4A373] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#111111] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={updateProfileMutation.isPending}
                onClick={async () => {
                  setUpdateProfileError(null);
                  setUpdateProfileSuccess(null);

                  const emailTrimmed = profileEmail.trim();
                  const nameValue = profileName.trim();

                  const emailChanged = emailTrimmed !== (apiUser?.email ?? initialUser.email);
                  const nameChanged = nameValue !== (apiUser?.name ?? initialUser.name);

                  if (!emailChanged && !nameChanged) return;

                  const payload: { email?: string; name?: string | null } = {};
                  if (emailChanged) payload.email = emailTrimmed;
                  if (nameChanged) payload.name = nameValue ? nameValue : null;

                  try {
                    const res = await updateProfileMutation.mutateAsync(payload);
                    const updated = res.data?.user;
                    if (updated && token) {
                      setAuth({ token, user: updated });
                    }
                    setUpdateProfileSuccess(res.message || "Profile updated");
                  } catch (e) {
                    if (e && typeof e === "object") {
                      const maybe = e as { status?: unknown; message?: unknown };
                      const status = typeof maybe.status === "number" ? maybe.status : null;
                      const message = typeof maybe.message === "string" ? maybe.message : null;
                      if (status === 409) {
                        setUpdateProfileError(message ?? "That email is already in use.");
                        return;
                      }
                      setUpdateProfileError(
                        status && status >= 500
                          ? "Something went wrong. Please try again."
                          : message ?? "Something went wrong. Please try again.",
                      );
                      return;
                    }
                    setUpdateProfileError("Something went wrong. Please try again.");
                  }
                }}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
              </button>
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

