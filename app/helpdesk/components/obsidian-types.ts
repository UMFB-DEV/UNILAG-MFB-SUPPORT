import type { Notification, Role, Ticket, User } from "@/lib/helpdesk/demoData";

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

export type HelpdeskState = {
  users: User[];
  tickets: Ticket[];
  notifications: Notification[];
};

export type MainView = "dashboard" | "tickets" | "my-tickets" | "new-ticket" | "settings";

