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

import {
  AdminDashboardCanvas,
  AgentPerformanceTable,
} from "./components/admin-dashboard-canvas";
import { ObsidianShell } from "./components/obsidian-shell";
import { type MainView } from "./components/obsidian-types";
import { ObsidianCard } from "./components/obsidian-ui";
import { TicketDetailModal } from "./components/ticket-detail-modal";
import { TicketTable } from "./components/ticket-table";

import { useAuthStore } from "@/stores/authStore";
import {
  useCreateTicketMutation,
  useAssignTicketMutation,
  useDeleteTicketMutation,
  useDepartmentTicketsQuery,
  useTakeTicketMutation,
  useTicketsQuery,
  useUpdateTicketStatusMutation,
} from "@/services/tickets/hooks";
import { useDepartmentsQuery } from "@/services/departments/hooks";
import {
  useForgotPasswordMutation,
  useUpdateProfileMutation,
} from "@/services/auth/hooks";
import {
  useCreateUserMutation,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useUpdateUserDepartmentMutation,
  useUpdateUserRoleMutation,
  useUsersQuery,
} from "@/services/users/hooks";
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
  type AdminTableUser = User & {
    department?: string | null;
    averageAssignedToResolvedMinutes?: number | null;
    isActive?: boolean;
  };

  const [toast, setToast] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [adminTicketsDepartmentFilter, setAdminTicketsDepartmentFilter] =
    useState<string>("");
  const [adminTicketsStatusFilter, setAdminTicketsStatusFilter] =
    useState<string>("");
  const [adminTicketsPriorityFilter, setAdminTicketsPriorityFilter] =
    useState<string>("");

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
  const [usersStatusFilter, setUsersStatusFilter] = useState<
    "all" | "active" | "deactivated"
  >("all");

  const [roleChange, setRoleChange] = useState<{
    userId: string;
    name: string;
    email: string;
    from: "user" | "agent" | "admin";
    to: "user" | "agent" | "admin";
  } | null>(null);

  const [userActivationChange, setUserActivationChange] = useState<{
    userId: string;
    name: string;
    email: string;
    isActive: boolean;
  } | null>(null);

  const [userViewTickets, setUserViewTickets] = useState<{
    userId: string;
    name: string;
    email: string;
  } | null>(null);

  const [deptChange, setDeptChange] = useState<{
    userId: string;
    name: string;
    email: string;
    from: string | null;
    to: string | null;
  } | null>(null);

  const [ticketDelete, setTicketDelete] = useState<{
    ticketId: string;
    title: string;
  } | null>(null);

  const effectiveRole = (apiUser?.role as Role | undefined) ?? initialUser.role;

  const UI_STATUS_BY_API: Record<string, TicketStatus> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  const UI_PRIORITY_BY_API: Record<string, TicketPriority> = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };

  const ticketListParams =
    view === "tickets" || view === "my-tickets"
      ? {
          page,
          limit,
          keyword: search.trim() ? search.trim() : undefined,
          status:
            effectiveRole === "admin" &&
            view === "tickets" &&
            adminTicketsStatusFilter
              ? adminTicketsStatusFilter
              : undefined,
          priority:
            effectiveRole === "admin" &&
            view === "tickets" &&
            adminTicketsPriorityFilter
              ? adminTicketsPriorityFilter
              : undefined,
        }
      : undefined;

  const ticketsListEnabled =
    Boolean(token) &&
    (view === "tickets" || view === "my-tickets" || effectiveRole !== "admin");

  const assignedTicketsQuery = useTicketsQuery({
    token,
    enabled: ticketsListEnabled,
    params: ticketListParams,
  });
  const departmentTicketsQuery = useDepartmentTicketsQuery({
    token,
    params: ticketListParams,
    enabled:
      ticketsListEnabled && effectiveRole === "agent" && view === "tickets",
  });

  const ticketsQuery =
    effectiveRole === "agent" && view === "tickets"
      ? departmentTicketsQuery
      : assignedTicketsQuery;

  const reportsSummaryQuery = useReportsSummaryQuery({
    token,
    enabled:
      Boolean(token) && effectiveRole === "admin" && view === "dashboard",
  });
  const adminUsersQuery = useUsersQuery({
    token,
    enabled:
      Boolean(token) &&
      effectiveRole === "admin" &&
      (view === "dashboard" ||
        view === "agents" ||
        view === "users" ||
        view === "tickets"),
  });
  const adminTicketsQuery = useTicketsQuery({
    token,
    enabled:
      Boolean(token) && effectiveRole === "admin" && view === "dashboard",
    params: { page: 1, limit: 100 },
  });

  const adminUserTicketsQuery = useTicketsQuery({
    token,
    enabled: Boolean(token) && effectiveRole === "admin" && view === "users",
    params: { page: 1, limit: 100 },
  });

  const userViewTicketsQuery = useTicketsQuery({
    token,
    enabled:
      Boolean(token) &&
      effectiveRole === "admin" &&
      view === "users" &&
      Boolean(userViewTickets?.userId),
    params: {
      page: 1,
      limit: 100,
      createdBy: userViewTickets?.userId,
    },
  });

  const userViewOwnedTickets = useMemo(() => {
    if (!userViewTickets) return [];
    const rawTickets = userViewTicketsQuery.data?.data ?? [];
    return rawTickets
      .filter((t) => {
        const createdById = t.createdBy?.id;
        const createdByEmail = t.createdBy?.email;
        return (
          createdById === userViewTickets.userId ||
          createdByEmail === userViewTickets.email
        );
      })
      .map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
  }, [userViewTickets, userViewTicketsQuery.data?.data]);

  const updateUserRoleMutation = useUpdateUserRoleMutation({ token });
  const updateUserDepartmentMutation = useUpdateUserDepartmentMutation({
    token,
  });
  const createUserMutation = useCreateUserMutation({ token });
  const deactivateUserMutation = useDeactivateUserMutation({ token });
  const reactivateUserMutation = useReactivateUserMutation({ token });

  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentDepartment, setNewAgentDepartment] = useState<string | null>(
    null,
  );
  const [createAgentSuccess, setCreateAgentSuccess] = useState<string | null>(
    null,
  );

  const adminDepartmentsQuery = useDepartmentsQuery({
    enabled:
      (view === "users" || view === "create-agent") &&
      effectiveRole === "admin",
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!(effectiveRole === "admin" && view === "dashboard")) return;
    if (reportsSummaryQuery.isSuccess) {
      // eslint-disable-next-line no-console
      console.log(
        "[admin dashboard] reportsSummaryQuery success",
        reportsSummaryQuery.data,
      );
    }
  }, [
    effectiveRole,
    view,
    reportsSummaryQuery.isSuccess,
    reportsSummaryQuery.data,
  ]);

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
  }, [
    effectiveRole,
    view,
    reportsSummaryQuery.isError,
    reportsSummaryQuery.error,
    reportsSummaryQuery.data,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!(effectiveRole === "admin" && view === "dashboard")) return;
    if (adminUsersQuery.isSuccess) {
      // eslint-disable-next-line no-console
      console.log(
        "[admin dashboard] adminUsersQuery success",
        adminUsersQuery.data,
      );
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
  }, [
    effectiveRole,
    view,
    adminUsersQuery.isError,
    adminUsersQuery.error,
    adminUsersQuery.data,
  ]);

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
  }, [
    effectiveRole,
    view,
    adminTicketsQuery.isError,
    adminTicketsQuery.error,
    adminTicketsQuery.data,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!(effectiveRole === "admin" && view === "dashboard")) return;
    if (adminTicketsQuery.isSuccess) {
      // eslint-disable-next-line no-console
      console.log(
        "[admin dashboard] adminTicketsQuery success",
        adminTicketsQuery.data,
      );
    }
  }, [
    effectiveRole,
    view,
    adminTicketsQuery.isSuccess,
    adminTicketsQuery.data,
  ]);

  const createTicketMutation = useCreateTicketMutation({ token });
  const [createTicketError, setCreateTicketError] = useState<string | null>(
    null,
  );
  const [showCreateTicketSuccess, setShowCreateTicketSuccess] = useState(false);

  const takeTicketMutation = useTakeTicketMutation({ token });
  const [takeTicketError, setTakeTicketError] = useState<string | null>(null);

  const assignTicketMutation = useAssignTicketMutation({ token });
  const [assignTicketId, setAssignTicketId] = useState<string | null>(null);

  const deleteTicketMutation = useDeleteTicketMutation({ token });
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null);

  const updateTicketStatusMutation = useUpdateTicketStatusMutation({ token });
  const [updateTicketStatusError, setUpdateTicketStatusError] = useState<
    string | null
  >(null);

  const departmentsQuery = useDepartmentsQuery({
    enabled: view === "new-ticket",
  });

  const forgotPasswordMutation = useForgotPasswordMutation();
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(
    null,
  );
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<
    string | null
  >(null);

  const updateProfileMutation = useUpdateProfileMutation({ token });
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [updateProfileError, setUpdateProfileError] = useState<string | null>(
    null,
  );
  const [updateProfileSuccess, setUpdateProfileSuccess] = useState<
    string | null
  >(null);

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
      const displayName = name && !name.includes("@") ? name : fallbackName;
      byEmail.set(key, {
        id: emailToId(key),
        email,
        role,
        name: displayName,
        color:
          role === "admin"
            ? "#4F46E5"
            : role === "agent"
              ? "#10B981"
              : "#EF4444",
      });
    }

    if (apiUser) {
      upsert(apiUser.email, (apiUser.role as Role) ?? "user", apiUser.name);
    }

    upsert(initialUser.email, initialUser.role, initialUser.name);

    const apiTickets = ticketsQuery.data?.data ?? [];
    for (const t of apiTickets) {
      upsert(
        t.createdBy.email,
        (t.createdBy.role as Role) ?? "user",
        t.createdBy.name ?? null,
      );
      if (t.assignedTo?.email) {
        upsert(
          t.assignedTo.email,
          (t.assignedTo.role as Role) ?? "agent",
          t.assignedTo.name ?? null,
        );
      }
    }

    return Array.from(byEmail.values());
  }, [ticketsQuery.data, apiUser, initialUser]);

  const mappedApiTickets = useMemo(() => {
    const apiTickets = ticketsQuery.data?.data ?? [];

    const statusMap: Record<
      (typeof apiTickets)[number]["status"],
      TicketStatus
    > = {
      open: "Open",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    };

    const priorityMap: Record<
      (typeof apiTickets)[number]["priority"],
      TicketPriority
    > = {
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
      const updated = Number.isFinite(updatedRaw)
        ? updatedRaw
        : Number.isFinite(created)
          ? created
          : Date.now();
      const resolvedRaw = t.resolvedAt ? Date.parse(t.resolvedAt) : NaN;
      const resolvedAt = Number.isFinite(resolvedRaw) ? resolvedRaw : undefined;
      const createdById = getUserId(t.createdBy.email);
      const assignedToId = t.assignedTo?.email
        ? getUserId(t.assignedTo.email)
        : null;

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
        imageUrl: t.imageUrl,
        createdBy: createdById,
        assignedTo: assignedToId,
        created: Number.isFinite(created) ? created : updated,
        updated,
        resolvedAt,
        comments: [],
      } satisfies Ticket;
    });
  }, [ticketsQuery.data]);

  const agentNameByApiId = useMemo(() => {
    const map = new Map<string, string>();
    const apiTickets = ticketsQuery.data?.data ?? [];
    for (const t of apiTickets) {
      const id = t.assignedTo?.id;
      const name = t.assignedTo?.name;
      if (id && typeof name === "string" && name.trim()) {
        map.set(id, name);
      }
    }
    return map;
  }, [ticketsQuery.data]);

  const adminMappedTickets = useMemo(() => {
    const apiTickets = adminTicketsQuery.data?.data ?? [];

    const statusMap: Record<
      (typeof apiTickets)[number]["status"],
      TicketStatus
    > = {
      open: "Open",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    };

    const priorityMap: Record<
      (typeof apiTickets)[number]["priority"],
      TicketPriority
    > = {
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
      const updated = Number.isFinite(updatedRaw)
        ? updatedRaw
        : Number.isFinite(created)
          ? created
          : Date.now();
      const resolvedRaw = t.resolvedAt ? Date.parse(t.resolvedAt) : NaN;
      const resolvedAt = Number.isFinite(resolvedRaw) ? resolvedRaw : undefined;
      const createdById = getUserId(t.createdBy.email);
      const assignedToId = t.assignedTo?.email
        ? getUserId(t.assignedTo.email)
        : null;

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
        imageUrl: t.imageUrl,
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
    image: null as File | null,
  });

  const currentUser = useMemo(() => {
    const fallbackId = emailToId(initialUser.email.toLowerCase());
    const fallback = {
      id: fallbackId,
      name: initialUser.name,
      email: initialUser.email,
      role: initialUser.role,
      color:
        initialUser.role === "admin"
          ? "#4F46E5"
          : initialUser.role === "agent"
            ? "#10B981"
            : "#EF4444",
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
  }, [initialUser, apiUser]);

  useEffect(() => {
    if (view !== "settings") return;
    setProfileName(apiUser?.name ?? initialUser.name);
    setProfileEmail(apiUser?.email ?? initialUser.email);
  }, [
    view,
    apiUser?.name,
    apiUser?.email,
    initialUser.name,
    initialUser.email,
  ]);

  const canManage =
    currentUser.role === "admin" || currentUser.role === "agent";
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

    if (!(currentUser.role === "admin" && view === "tickets")) return scoped;

    return scoped.filter((t) => {
      if (
        adminTicketsDepartmentFilter &&
        t.category !== adminTicketsDepartmentFilter
      )
        return false;

      if (adminTicketsStatusFilter) {
        const uiStatus = UI_STATUS_BY_API[adminTicketsStatusFilter];
        if (uiStatus && t.status !== uiStatus) return false;
      }

      if (adminTicketsPriorityFilter) {
        const uiPriority = UI_PRIORITY_BY_API[adminTicketsPriorityFilter];
        if (uiPriority && t.priority !== uiPriority) return false;
      }

      return true;
    });
  }, [
    tickets,
    currentUser,
    view,
    adminTicketsDepartmentFilter,
    adminTicketsStatusFilter,
    adminTicketsPriorityFilter,
    UI_STATUS_BY_API,
    UI_PRIORITY_BY_API,
  ]);

  const adminTicketsDepartmentOptions = useMemo(() => {
    if (!(currentUser.role === "admin" && view === "tickets"))
      return [] as string[];
    const set = new Set<string>();
    for (const t of tickets) {
      if (t.category) set.add(t.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickets, currentUser.role, view]);

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

    return {
      total: summary.totalTickets,
      open: summary.openTickets,
      progress: summary.inProgressTickets,
      resolved: summary.resolvedTickets,
      closed: summary.closedTickets,
    };
  }, [adminStats, reportsSummaryQuery.data?.data]);

  const adminUsers = useMemo((): AdminTableUser[] => {
    const raw = adminUsersQuery.data?.data ?? [];
    return raw.map((u) => {
      const role =
        u.role === "admin" || u.role === "agent" || u.role === "user"
          ? u.role
          : "user";
      const fallbackName = u.email.split("@")[0] || u.email;
      const displayName =
        u.name && !u.name.includes("@") ? u.name : fallbackName;
      return {
        id: emailToId(u.email.toLowerCase()),
        name: displayName,
        email: u.email,
        role,
        department: u.department ?? null,
        averageAssignedToResolvedMinutes:
          typeof (u as { averageAssignedToResolvedMinutes?: unknown })
            .averageAssignedToResolvedMinutes === "number"
            ? (u as { averageAssignedToResolvedMinutes: number })
                .averageAssignedToResolvedMinutes
            : null,
        isActive:
          typeof (u as { isActive?: unknown }).isActive === "boolean"
            ? (u as { isActive: boolean }).isActive
            : true,
        color:
          role === "admin"
            ? "#4F46E5"
            : role === "agent"
              ? "#10B981"
              : "#EF4444",
      };
    });
  }, [adminUsersQuery.data]);

  const adminAgents = useMemo(
    () => adminUsers.filter((u) => u.role === "agent"),
    [adminUsers],
  );

  const adminTicketUsersForDisplay = useMemo(() => {
    // apiUsers are derived from the tickets payload and include assignedTo.name when present.
    // Put them last so they win if there are id collisions.
    return [...adminUsers, ...apiUsers];
  }, [adminUsers, apiUsers]);

  const adminAgentsRaw = useMemo(
    () => (adminUsersQuery.data?.data ?? []).filter((u) => u.role === "agent"),
    [adminUsersQuery.data?.data],
  );

  const adminAssignOptionsByTicketId = useMemo(() => {
    const map: Record<string, { id: string; name: string; email: string }[]> =
      {};
    for (const t of adminMappedTickets) {
      if (t.assignedTo) continue;
      map[t.id] = adminAgentsRaw
        .filter((a) => !a.department || a.department === t.category)
        .map((a) => ({
          id: a.id,
          name:
            agentNameByApiId.get(a.id) ?? (a.name?.trim() ? a.name : a.email),
          email: a.email,
        }));
    }
    return map;
  }, [adminAgentsRaw, adminMappedTickets, agentNameByApiId]);
  const adminTicketsAssignOptionsByTicketId = useMemo(() => {
    const map: Record<string, { id: string; name: string; email: string }[]> =
      {};
    for (const t of mappedApiTickets) {
      const dept = t.category;
      const agents = adminAgentsRaw.filter((a) => a.department === dept);
      map[t.id] = agents.map((a) => {
        const label = agentNameByApiId.get(a.id) ?? a.name ?? a.email;
        return { id: a.id, name: label, email: a.email };
      });
    }
    return map;
  }, [adminAgentsRaw, mappedApiTickets, agentNameByApiId]);

  const selectedTicketReassignOptions = useMemo(() => {
    if (!selectedTicket || currentUser.role !== "admin") return [];
    const dept = selectedTicket.category;
    const agents = adminAgentsRaw.filter((a) => a.department === dept);
    return agents.map((a) => {
      const label = agentNameByApiId.get(a.id) ?? a.name ?? a.email;
      return { id: a.id, name: label, email: a.email };
    });
  }, [adminAgentsRaw, agentNameByApiId, currentUser.role, selectedTicket]);

  const adminUsersRawFiltered = useMemo(() => {
    const raw = adminUsersQuery.data?.data ?? [];
    const q = usersSearch.trim().toLowerCase();
    const statusFiltered = raw.filter((u) => {
      const isActive =
        typeof (u as { isActive?: unknown }).isActive === "boolean"
          ? (u as { isActive: boolean }).isActive
          : true;
      if (usersStatusFilter === "active") return isActive;
      if (usersStatusFilter === "deactivated") return !isActive;
      return true;
    });

    if (!q) return statusFiltered;
    return statusFiltered.filter((u) => {
      const parts = [
        u.name,
        u.email,
        u.role,
        u.department ?? "",
        u.createdAt ?? "",
      ];
      return parts.some((p) => String(p).toLowerCase().includes(q));
    });
  }, [adminUsersQuery.data?.data, usersSearch, usersStatusFilter]);

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
        image: newTicket.image ?? undefined,
      });

      setNewTicket({
        title: "",
        desc: "",
        department: "",
        priority: "Medium",
        image: null,
      });
      setShowCreateTicketSuccess(true);
    } catch (e) {
      if (e && typeof e === "object") {
        const maybe = e as { status?: unknown; message?: unknown };
        const status = typeof maybe.status === "number" ? maybe.status : null;
        const message =
          typeof maybe.message === "string" ? maybe.message : null;
        setCreateTicketError(
          status && status >= 500
            ? "Something went wrong. Please try again."
            : (message ?? "Something went wrong. Please try again."),
        );
        return;
      }
      setCreateTicketError("Something went wrong. Please try again.");
    }
  }

  async function deleteTicket(ticketId: string) {
    if (deleteTicketMutation.isPending) return;
    setDeleteTicketId(ticketId);
    try {
      await deleteTicketMutation.mutateAsync({ ticketId });
      setTicketDelete(null);
    } catch {
      // noop
    } finally {
      setDeleteTicketId(null);
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
        const message =
          typeof maybe.message === "string" ? maybe.message : null;
        setTakeTicketError(
          status && status >= 500
            ? "Something went wrong. Please try again."
            : (message ?? "Something went wrong. Please try again."),
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
      setUpdateTicketStatusError(
        `Cannot revert status from ${ticket.status} to ${status}.`,
      );
      return;
    }

    if (currentUser.role === "agent" && ticket.assignedTo !== currentUser.id) {
      setUpdateTicketStatusError(
        "You can only update tickets assigned to you.",
      );
      return;
    }

    const statusMap: Record<
      TicketStatus,
      "open" | "in_progress" | "resolved" | "closed"
    > = {
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
        const message =
          typeof maybe.message === "string" ? maybe.message : null;

        if (s === 400 && statusOrder[status] < statusOrder[ticket.status]) {
          setUpdateTicketStatusError(
            `Cannot revert status from ${ticket.status} to ${status}.`,
          );
          return;
        }

        setUpdateTicketStatusError(
          s && s >= 500
            ? "Something went wrong. Please try again."
            : (message ?? "Something went wrong. Please try again."),
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

  async function assignTicket(ticketId: string, assignedToId: string) {
    if (assignTicketMutation.isPending) return;
    setAssignTicketId(ticketId);
    try {
      await assignTicketMutation.mutateAsync({
        ticketId,
        input: { assignedToId },
      });
    } catch {
      // noop
    } finally {
      setAssignTicketId(null);
    }
  }

  async function reassignTicketFromModal(
    ticketId: string,
    assignedToId: string,
  ) {
    const option = selectedTicketReassignOptions.find(
      (o) => o.id === assignedToId,
    );
    const label = option?.name || option?.email || "agent";
    try {
      await assignTicket(ticketId, assignedToId);
      setToast({ tone: "success", message: `Ticket assigned to ${label}.` });
    } catch (e) {
      if (e && typeof e === "object") {
        const maybe = e as { status?: unknown; message?: unknown };
        const message =
          typeof maybe.message === "string" ? maybe.message : null;
        setToast({
          tone: "error",
          message: message ?? "Failed to reassign ticket.",
        });
        return;
      }
      setToast({ tone: "error", message: "Failed to reassign ticket." });
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
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
              ? "Dashboard"
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
              : "UNILAG MFB TICKETING SYSTEM"}
          </p>
        </div>
        {(view === "tickets" || view === "my-tickets") && (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            {currentUser.role === "admin" && view === "tickets" ? (
              <>
                <select
                  value={adminTicketsDepartmentFilter}
                  onChange={(e) => {
                    setAdminTicketsDepartmentFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full max-w-[220px] rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7b3434]"
                >
                  <option value="">All Departments</option>
                  {adminTicketsDepartmentOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={adminTicketsStatusFilter}
                  onChange={(e) => {
                    setAdminTicketsStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full max-w-[180px] rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7b3434]"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={adminTicketsPriorityFilter}
                  onChange={(e) => {
                    setAdminTicketsPriorityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full max-w-[170px] rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7b3434]"
                >
                  <option value="">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </>
            ) : null}

            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search tickets..."
              className="w-full max-w-xs rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7b3434]"
            />
          </div>
        )}

        {view === "users" && currentUser.role === "admin" && (
          <input
            value={usersSearch}
            onChange={(e) => setUsersSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full max-w-xs rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7b3434]"
          />
        )}
      </div>

      {view === "dashboard" &&
        currentUser.role === "admin" &&
        (reportsSummaryQuery.isError || adminUsersQuery.isError ? (
          <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] p-6 text-sm text-zinc-300">
            Failed to load admin dashboard.
          </div>
        ) : reportsSummaryQuery.isLoading || adminUsersQuery.isLoading ? (
          <AdminDashboardCanvas
            stats={{ total: 0, open: 0, progress: 0, resolved: 0, closed: 0 }}
            tickets={[]}
            users={[]}
            averageResolutionMinutes={null}
            closedTickets={0}
            onViewAllAgents={() => setView("agents")}
            loading
          />
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
              averageResolutionMinutes={
                reportsSummaryQuery.data?.data
                  ?.averageAssignedToResolvedMinutes ?? null
              }
              closedTickets={reportsSummaryQuery.data?.data?.closedTickets ?? 0}
              onViewAllAgents={() => setView("agents")}
            />
          </div>
        ))}

      {view === "agents" &&
        currentUser.role === "admin" &&
        (adminUsersQuery.isError ? (
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
        ))}

      {view === "create-agent" && currentUser.role === "admin" && (
        <ObsidianCard
            title="Create Agent"
            subtitle="Create a new support agent in UNILAG MFB TICKETING SYSTEM"
          >
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
                {createUserMutation.error instanceof Error
                  ? createUserMutation.error.message
                  : "Failed to create agent"}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">
                  Email
                </label>
                <input
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  placeholder="agent@company.com"
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7b3434]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400">
                  Password
                </label>
                <input
                  value={newAgentPassword}
                  onChange={(e) => setNewAgentPassword(e.target.value)}
                  placeholder="********"
                  type="password"
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7b3434]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Department
              </label>
              <select
                className="w-full max-w-[360px] rounded-lg border border-[#2A2A2C] bg-[#111111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#7b3434]"
                value={newAgentDepartment ?? ""}
                disabled={
                  adminDepartmentsQuery.isLoading ||
                  adminDepartmentsQuery.isError
                }
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
                <div className="mt-2 text-xs text-zinc-500">
                  Failed to load departments.
                </div>
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
                className="rounded-lg bg-[#7b3434] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={
                  createUserMutation.isPending ||
                  !newAgentEmail.trim() ||
                  !newAgentPassword
                }
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
            <h3 className="text-lg font-semibold text-zinc-100">
              Confirm role change
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Change role for{" "}
              <span className="font-semibold text-zinc-200">
                {roleChange.name}
              </span>{" "}
              ({roleChange.email}) from{" "}
              <span className="font-semibold text-zinc-200">
                {roleChange.from}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-zinc-200">
                {roleChange.to}
              </span>
              ?
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
                className="rounded-lg bg-[#7b3434] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
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

      {view === "users" &&
      currentUser.role === "admin" &&
      userActivationChange ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1F1F21] bg-[#111111] p-6">
            <h3 className="text-lg font-semibold text-zinc-100">
              {userActivationChange.isActive
                ? "Deactivate account"
                : "Reactivate account"}
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              {userActivationChange.isActive
                ? "Deactivate this account? User will not be able to login."
                : "Reactivate this account? User will be able to login again."}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              <span className="font-semibold text-zinc-200">
                {userActivationChange.name}
              </span>{" "}
              ({userActivationChange.email})
            </p>

            {userActivationChange.isActive && deactivateUserMutation.isError ? (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {deactivateUserMutation.error instanceof Error
                  ? deactivateUserMutation.error.message
                  : "Failed to deactivate user"}
              </div>
            ) : null}

            {!userActivationChange.isActive &&
            reactivateUserMutation.isError ? (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {reactivateUserMutation.error instanceof Error
                  ? reactivateUserMutation.error.message
                  : "Failed to reactivate user"}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-[#2A2A2C] bg-[#111111] px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
                disabled={
                  deactivateUserMutation.isPending ||
                  reactivateUserMutation.isPending
                }
                onClick={() => {
                  deactivateUserMutation.reset();
                  reactivateUserMutation.reset();
                  setUserActivationChange(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  userActivationChange.isActive
                    ? "bg-red-500"
                    : "bg-emerald-500"
                }`}
                disabled={
                  deactivateUserMutation.isPending ||
                  reactivateUserMutation.isPending
                }
                onClick={async () => {
                  try {
                    if (userActivationChange.isActive) {
                      await deactivateUserMutation.mutateAsync({
                        userId: userActivationChange.userId,
                      });
                      setToast({
                        tone: "success",
                        message: "User deactivated.",
                      });
                    } else {
                      await reactivateUserMutation.mutateAsync({
                        userId: userActivationChange.userId,
                      });
                      setToast({
                        tone: "success",
                        message: "User reactivated.",
                      });
                    }
                    setTimeout(() => setToast(null), 2500);
                    setUserActivationChange(null);
                  } catch {
                    setToast({
                      tone: "error",
                      message: userActivationChange.isActive
                        ? "Failed to deactivate user."
                        : "Failed to reactivate user.",
                    });
                    setTimeout(() => setToast(null), 2500);
                  }
                }}
              >
                {deactivateUserMutation.isPending ||
                reactivateUserMutation.isPending
                  ? "Working..."
                  : userActivationChange.isActive
                    ? "Deactivate"
                    : "Reactivate"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {view === "users" && currentUser.role === "admin" && userViewTickets ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-[#1F1F21] bg-[#111111] p-6">
            <h3 className="text-lg font-semibold text-zinc-100">
              User tickets
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Tickets created by{" "}
              <span className="font-semibold text-zinc-200">
                {userViewTickets.name}
              </span>{" "}
              ({userViewTickets.email}).
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Status:{" "}
              {(() => {
                const u = (adminUsersQuery.data?.data ?? []).find(
                  (x) => x.id === userViewTickets.userId,
                );
                const isActive =
                  u &&
                  typeof (u as { isActive?: unknown }).isActive === "boolean"
                    ? (u as { isActive: boolean }).isActive
                    : true;
                return (
                  <span
                    className={isActive ? "text-emerald-300" : "text-zinc-400"}
                  >
                    {isActive ? "Active" : "Deactivated"}
                  </span>
                );
              })()}
            </p>

            {userViewTicketsQuery.isError ? (
              <div className="mt-4 text-sm text-zinc-300">
                Failed to load tickets for this user.
              </div>
            ) : userViewTicketsQuery.isLoading ? (
              <div className="mt-4 text-sm text-zinc-300">
                Loading tickets...
              </div>
            ) : userViewOwnedTickets.length === 0 ? (
              <div className="mt-4 text-sm text-zinc-300">
                No tickets found for this user.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-[#1F1F21] text-xs text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Ticket</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F21]">
                    {userViewOwnedTickets.map((t) => (
                      <tr key={t.id} className="text-zinc-200">
                        <td className="px-4 py-3">
                          <div className="text-zinc-200">{t.title}</div>
                          <div className="mt-1 font-mono text-[11px] text-zinc-500">
                            {t.id}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {t.category}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{t.status}</td>
                        <td className="px-4 py-3 text-zinc-300">
                          {t.priority}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {t.updatedAt ?? t.createdAt ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-[#2A2A2C] bg-[#111111] px-4 py-2 text-sm text-zinc-200"
                onClick={() => setUserViewTickets(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {view === "users" && currentUser.role === "admin" && deptChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1F1F21] bg-[#111111] p-6">
            <h3 className="text-lg font-semibold text-zinc-100">
              Confirm department change
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Change department for{" "}
              <span className="font-semibold text-zinc-200">
                {deptChange.name}
              </span>{" "}
              ({deptChange.email}) from{" "}
              <span className="font-semibold text-zinc-200">
                {deptChange.from ?? "—"}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-zinc-200">
                {deptChange.to ?? "—"}
              </span>
              ?
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
                className="rounded-lg bg-[#7b3434] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
                {updateUserDepartmentMutation.isPending
                  ? "Updating..."
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "users" &&
        currentUser.role === "admin" &&
        (adminUsersQuery.isError ? (
          <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] p-6 text-sm text-zinc-300">
            Failed to load users.
          </div>
        ) : adminUsersQuery.isLoading ? (
          <div className="rounded-xl border border-[#1F1F21] bg-[#0B0B0C] p-6 text-sm text-zinc-300">
            Loading users...
          </div>
        ) : (
          <ObsidianCard
            title="Registered Users"
            subtitle="All registered users in UNILAG MFB TICKETING SYSTEM"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4">
              <div className="text-xs text-zinc-500">Filter:</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    usersStatusFilter === "all"
                      ? "border-[#ACD23C] text-[#ACD23C]"
                      : "border-[#2A2A2C] text-zinc-300"
                  }`}
                  onClick={() => {
                    setUsersStatusFilter("all");
                    setUsersPage(1);
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    usersStatusFilter === "active"
                      ? "border-[#ACD23C] text-[#ACD23C]"
                      : "border-[#2A2A2C] text-zinc-300"
                  }`}
                  onClick={() => {
                    setUsersStatusFilter("active");
                    setUsersPage(1);
                  }}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    usersStatusFilter === "deactivated"
                      ? "border-[#ACD23C] text-[#ACD23C]"
                      : "border-[#2A2A2C] text-zinc-300"
                  }`}
                  onClick={() => {
                    setUsersStatusFilter("deactivated");
                    setUsersPage(1);
                  }}
                >
                  Deactivated
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F21] text-xs text-zinc-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F21]">
                  {adminUsersRawPage.map((u) => (
                    <tr
                      key={u.id}
                      className="cursor-pointer text-zinc-200 hover:bg-white/5"
                      onClick={() => {
                        setUserViewTickets({
                          userId: u.id,
                          name: u.name,
                          email: u.email,
                        });
                      }}
                    >
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const isActive =
                            typeof (u as { isActive?: unknown }).isActive ===
                            "boolean"
                              ? (u as { isActive: boolean }).isActive
                              : true;
                          return (
                            <span
                              className={
                                isActive ? "text-emerald-300" : "text-zinc-400"
                              }
                            >
                              {isActive ? "Active" : "Deactivated"}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full max-w-[160px] rounded-lg border border-[#2A2A2C] bg-[#111111] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#7b3434]"
                          value={u.role}
                          disabled={(() => {
                            const isActive =
                              typeof (u as { isActive?: unknown }).isActive ===
                              "boolean"
                                ? (u as { isActive: boolean }).isActive
                                : true;
                            return !isActive;
                          })()}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            const nextRole = e.target.value as
                              | "user"
                              | "agent"
                              | "admin";
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
                          className="w-full max-w-[280px] rounded-lg border border-[#2A2A2C] bg-[#111111] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#7b3434]"
                          value={u.department ?? ""}
                          disabled={
                            adminDepartmentsQuery.isLoading ||
                            adminDepartmentsQuery.isError ||
                            !(typeof (u as { isActive?: unknown }).isActive ===
                            "boolean"
                              ? (u as { isActive: boolean }).isActive
                              : true)
                          }
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            const nextDept = e.target.value
                              ? e.target.value
                              : null;
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
                      <td className="px-4 py-3 text-zinc-400">
                        {u.createdAt ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                            (
                              typeof (u as { isActive?: unknown }).isActive ===
                              "boolean"
                                ? (u as { isActive: boolean }).isActive
                                : true
                            )
                              ? "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            deactivateUserMutation.reset();
                            reactivateUserMutation.reset();
                            const isActive =
                              typeof (u as { isActive?: unknown }).isActive ===
                              "boolean"
                                ? (u as { isActive: boolean }).isActive
                                : true;
                            setUserActivationChange({
                              userId: u.id,
                              name: u.name,
                              email: u.email,
                              isActive,
                            });
                          }}
                        >
                          {(() => {
                            const isActive =
                              typeof (u as { isActive?: unknown }).isActive ===
                              "boolean"
                                ? (u as { isActive: boolean }).isActive
                                : true;
                            return isActive ? "Deactivate" : "Reactivate";
                          })()}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {adminUsersRawFiltered.length === 0 ? (
                <div className="px-4 py-6 text-sm text-zinc-400">
                  No users found.
                </div>
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
                    onClick={() =>
                      setUsersPage((p) => Math.min(usersTotalPages, p + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </ObsidianCard>
        ))}

      {(view === "tickets" || view === "my-tickets") && (
        <ObsidianCard
          title={view === "my-tickets" ? "My Tickets" : "Tickets"}
          subtitle="Click a row to open ticket detail"
        >
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
                {currentUser.role === "admin" &&
                view === "tickets" &&
                (adminTicketsDepartmentFilter ||
                  adminTicketsStatusFilter ||
                  adminTicketsPriorityFilter)
                  ? "No tickets match your filters"
                  : search.trim()
                    ? "No tickets match your search"
                    : effectiveRole === "agent" && view === "tickets"
                      ? "No department tickets yet"
                      : "No tickets yet"}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {currentUser.role === "admin" &&
                view === "tickets" &&
                (adminTicketsDepartmentFilter ||
                  adminTicketsStatusFilter ||
                  adminTicketsPriorityFilter)
                  ? "Try clearing or adjusting your filters."
                  : search.trim()
                    ? "Try adjusting your search terms or filters."
                    : effectiveRole === "agent" && view === "tickets"
                      ? "Tickets created in your department will show up here."
                      : "When you create a ticket, it will show up here with its status and updates."}
              </p>
              {currentUser.role === "admin" &&
              view === "tickets" &&
              (adminTicketsDepartmentFilter ||
                adminTicketsStatusFilter ||
                adminTicketsPriorityFilter) ? (
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => {
                      setAdminTicketsDepartmentFilter("");
                      setAdminTicketsStatusFilter("");
                      setAdminTicketsPriorityFilter("");
                      setPage(1);
                    }}
                    className="rounded-lg border border-[#1F1F21] bg-transparent px-5 py-2 text-sm font-semibold text-zinc-300 hover:bg-[#1A1A1A]"
                    type="button"
                  >
                    Clear filters
                  </button>
                </div>
              ) : search.trim() ? (
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
                    className="rounded-lg bg-[#7b3434] px-5 py-2 text-sm font-semibold text-white"
                    type="button"
                  >
                    Create your first ticket
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentUser.role === "admin" &&
              view === "tickets" &&
              ticketDelete ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                  <div className="w-full max-w-md rounded-2xl border border-[#1F1F21] bg-[#111111] p-6">
                    <h3 className="text-lg font-semibold text-zinc-100">
                      Confirm delete ticket
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      Delete{" "}
                      <span className="font-semibold text-zinc-200">
                        {ticketDelete.title}
                      </span>
                      ? This action cannot be undone.
                    </p>

                    {deleteTicketMutation.isError ? (
                      <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                        {deleteTicketMutation.error instanceof Error
                          ? deleteTicketMutation.error.message
                          : "Failed to delete ticket"}
                      </div>
                    ) : null}

                    <div className="mt-6 flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-[#2A2A2C] bg-[#111111] px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
                        disabled={deleteTicketMutation.isPending}
                        onClick={() => {
                          deleteTicketMutation.reset();
                          setTicketDelete(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        disabled={
                          deleteTicketMutation.isPending ||
                          deleteTicketId === ticketDelete.ticketId
                        }
                        onClick={() => deleteTicket(ticketDelete.ticketId)}
                      >
                        {deleteTicketMutation.isPending ||
                        deleteTicketId === ticketDelete.ticketId
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <TicketTable
                tickets={visibleTickets}
                users={
                  currentUser.role === "admin" && view === "tickets"
                    ? adminTicketUsersForDisplay
                    : apiUsers
                }
                onOpen={setSelectedTicketId}
                canAssign={currentUser.role === "admin" && view === "tickets"}
                assignOptionsByTicketId={
                  currentUser.role === "admin" && view === "tickets"
                    ? adminTicketsAssignOptionsByTicketId
                    : undefined
                }
                onAssign={
                  currentUser.role === "admin" && view === "tickets"
                    ? assignTicket
                    : undefined
                }
                assigningTicketId={
                  currentUser.role === "admin" && view === "tickets"
                    ? assignTicketId
                    : undefined
                }
                onDelete={
                  currentUser.role === "admin" && view === "tickets"
                    ? (ticketId) => {
                        const t = visibleTickets.find((x) => x.id === ticketId);
                        if (!t) return;
                        deleteTicketMutation.reset();
                        setTicketDelete({ ticketId: t.id, title: t.title });
                      }
                    : undefined
                }
                deletingTicketId={deleteTicketId}
              />

              {ticketsQuery.data?.meta?.totalPages &&
              ticketsQuery.data.meta.totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500">
                    Page {ticketsQuery.data.meta.page} of{" "}
                    {ticketsQuery.data.meta.totalPages}
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
                          Math.min(
                            ticketsQuery.data?.meta?.totalPages ?? p + 1,
                            p + 1,
                          ),
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
        <ObsidianCard
          title="New Ticket"
          subtitle="Submit a request to the support archive"
        >
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
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                Title
              </label>
              <input
                value={newTicket.title}
                onChange={(e) =>
                  setNewTicket((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434]"
                placeholder="Brief issue title"
                disabled={createTicketMutation.isPending}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Department
                </label>
                <select
                  value={newTicket.department}
                  onChange={(e) =>
                    setNewTicket((p) => ({ ...p, department: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434]"
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
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) =>
                    setNewTicket((p) => ({
                      ...p,
                      priority: e.target.value as TicketPriority,
                    }))
                  }
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434]"
                  disabled={createTicketMutation.isPending}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                Description
              </label>
              <textarea
                value={newTicket.desc}
                onChange={(e) =>
                  setNewTicket((p) => ({ ...p, desc: e.target.value }))
                }
                rows={7}
                className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434]"
                placeholder="Describe your issue in detail"
                disabled={createTicketMutation.isPending}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                Image (Optional)
              </label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setNewTicket((p) => ({ ...p, image: file }));
                  }}
                  className="hidden"
                  id="ticket-image-upload"
                  disabled={createTicketMutation.isPending}
                />
                <label
                  htmlFor="ticket-image-upload"
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-4 py-2 text-sm text-zinc-300 hover:border-[#7b3434] hover:text-zinc-100 disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {newTicket.image ? newTicket.image.name : "Choose Image"}
                </label>
                {newTicket.image && (
                  <button
                    type="button"
                    onClick={() => setNewTicket((p) => ({ ...p, image: null }))}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={createTicket}
                className="rounded-lg bg-[#7b3434] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending
                  ? "Submitting..."
                  : "Submit Ticket"}
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
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Name
                </label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  disabled={updateProfileMutation.isPending}
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Email
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  disabled={updateProfileMutation.isPending}
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434] disabled:opacity-60"
                />
              </div>

              <div className="space-y-2 text-sm text-zinc-300">
                <p>
                  <span className="text-zinc-500">Current role:</span>{" "}
                  {ROLE_LABEL[currentUser.role]}
                </p>
              </div>

              <button
                type="button"
                className="w-full rounded-lg bg-[#7b3434] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={updateProfileMutation.isPending}
                onClick={async () => {
                  setUpdateProfileError(null);
                  setUpdateProfileSuccess(null);

                  const emailTrimmed = profileEmail.trim();
                  const nameValue = profileName.trim();

                  const emailChanged =
                    emailTrimmed !== (apiUser?.email ?? initialUser.email);
                  const nameChanged =
                    nameValue !== (apiUser?.name ?? initialUser.name);

                  if (!emailChanged && !nameChanged) return;

                  const payload: { email?: string; name?: string | null } = {};
                  if (emailChanged) payload.email = emailTrimmed;
                  if (nameChanged) payload.name = nameValue ? nameValue : null;

                  try {
                    const res =
                      await updateProfileMutation.mutateAsync(payload);
                    const updated = res.data?.user;
                    if (updated && token) {
                      setAuth({ token, user: updated });
                    }
                    setUpdateProfileSuccess(res.message || "Profile updated");
                  } catch (e) {
                    if (e && typeof e === "object") {
                      const maybe = e as {
                        status?: unknown;
                        message?: unknown;
                      };
                      const status =
                        typeof maybe.status === "number" ? maybe.status : null;
                      const message =
                        typeof maybe.message === "string"
                          ? maybe.message
                          : null;
                      if (status === 409) {
                        setUpdateProfileError(
                          message ?? "That email is already in use.",
                        );
                        return;
                      }
                      setUpdateProfileError(
                        status && status >= 500
                          ? "Something went wrong. Please try again."
                          : (message ??
                              "Something went wrong. Please try again."),
                      );
                      return;
                    }
                    setUpdateProfileError(
                      "Something went wrong. Please try again.",
                    );
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
                We’ll email you a password reset link. The link expires after 60
                minutes.
              </p>
              <button
                type="button"
                className="w-full rounded-lg bg-[#7b3434] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={forgotPasswordMutation.isPending}
                onClick={async () => {
                  setResetPasswordError(null);
                  setResetPasswordSuccess(null);
                  try {
                    const res = await forgotPasswordMutation.mutateAsync({
                      email: currentUser.email,
                    });
                    setResetPasswordSuccess(
                      res.message ||
                        "If an account exists for that email, a reset link has been sent.",
                    );
                  } catch (e) {
                    if (e && typeof e === "object") {
                      const maybe = e as {
                        status?: unknown;
                        message?: unknown;
                      };
                      const status =
                        typeof maybe.status === "number" ? maybe.status : null;
                      const message =
                        typeof maybe.message === "string"
                          ? maybe.message
                          : null;
                      setResetPasswordError(
                        status && status >= 500
                          ? "Something went wrong. Please try again."
                          : (message ??
                              "Something went wrong. Please try again."),
                      );
                      return;
                    }
                    setResetPasswordError(
                      "Something went wrong. Please try again.",
                    );
                  }
                }}
              >
                {forgotPasswordMutation.isPending
                  ? "Sending..."
                  : "Send reset link"}
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
          canReassign={
            currentUser.role === "admin" && Boolean(selectedTicket.category)
          }
          reassignOptions={
            currentUser.role === "admin"
              ? selectedTicketReassignOptions
              : undefined
          }
          onReassign={
            currentUser.role === "admin" ? reassignTicketFromModal : undefined
          }
          reassignPending={
            currentUser.role === "admin"
              ? assignTicketMutation.isPending &&
                assignTicketId === selectedTicket.id
              : undefined
          }
          canComment={
            selectedTicket.status !== "Closed" &&
            (currentUser.role === "admin" ||
              (currentUser.role === "agent" &&
                selectedTicket.assignedTo === currentUser.id) ||
              (currentUser.role === "user" &&
                selectedTicket.createdBy === currentUser.id))
          }
          canInternalComment={
            currentUser.role === "admin" || currentUser.role === "agent"
          }
          canTakeTicket={
            currentUser.role === "agent" &&
            selectedTicket.status === "Open" &&
            !selectedTicket.assignedTo
          }
          takeTicketError={takeTicketError}
          takeTicketPending={takeTicketMutation.isPending}
          onTakeTicket={takeTicket}
          canUpdateStatus={
            currentUser.role === "admin" ||
            (currentUser.role === "agent" &&
              selectedTicket.assignedTo === currentUser.id)
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
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ACD23C]/20">
                <svg
                  className="h-6 w-6 text-[#ACD23C]"
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
              <h2 className="text-2xl font-semibold text-zinc-100">
                Ticket Submitted
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Your ticket has been created successfully.
              </p>
            </div>
            <button
              className="w-full rounded-lg bg-[#7b3434] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:brightness-110"
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

      {toast ? (
        <div className="fixed bottom-5 right-5 z-[60]">
          <div
            className={`rounded-lg border px-4 py-3 text-sm shadow-2xl ${
              toast.tone === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border-red-500/30 bg-red-500/10 text-red-100"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </ObsidianShell>
  );
}
