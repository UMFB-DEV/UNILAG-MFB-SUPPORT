export type Role = "admin" | "agent" | "user";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  color: string;
};

const NOW = Date.now();
const DAY = 86_400_000;

export const DEMO_USERS: User[] = [
  { id: 1, name: "Alex Morgan", email: "admin@helpdesk.com", role: "admin", color: "#4F46E5" },
  { id: 2, name: "Sam Rivera", email: "agent@helpdesk.com", role: "agent", color: "#10B981" },
  { id: 3, name: "Casey Lee", email: "agent2@helpdesk.com", role: "agent", color: "#F59E0B" },
  { id: 4, name: "Jordan Kim", email: "user@helpdesk.com", role: "user", color: "#EF4444" },
  { id: 5, name: "Taylor Chen", email: "user2@helpdesk.com", role: "user", color: "#8B5CF6" },
];

export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketPriority = "Low" | "Medium" | "High";
export type TicketCategory = "IT" | "Billing" | "Operations" | "HR" | "Other";

export type Comment = {
  id: number;
  author: number;
  text: string;
  type: "public" | "internal";
  time: number;
};

export type Ticket = {
  id: string;
  title: string;
  desc: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  imageUrl?: string | null;
  createdBy: number;
  assignedTo: number | null;
  created: number;
  updated: number;
  resolvedAt?: number;
  comments: Comment[];
};

export const DEMO_TICKETS: Ticket[] = [
  {
    id: "TKT-001",
    title: "Cannot access VPN from home",
    desc: "Getting authentication error when connecting to company VPN. Error code: 691. Tried resetting password but still failing.",
    category: "IT",
    priority: "High",
    status: "Open",
    createdBy: 4,
    assignedTo: 2,
    created: NOW - 2 * DAY,
    updated: NOW - DAY,
    comments: [
      { id: 1, author: 2, text: "I've escalated this to the network team. Will update shortly.", type: "public", time: NOW - 20 * 3_600_000 },
    ],
  },
  {
    id: "TKT-002",
    title: "Incorrect invoice amount on subscription",
    desc: "My last invoice shows $299 but my plan is only $199/month. Please review and issue a credit note.",
    category: "Billing",
    priority: "High",
    status: "In Progress",
    createdBy: 5,
    assignedTo: 2,
    created: NOW - 5 * DAY,
    updated: NOW - 2 * DAY,
    comments: [{ id: 2, author: 2, text: "Reviewing billing records now.", type: "internal", time: NOW - 3 * DAY }],
  },
  {
    id: "TKT-003",
    title: "Printer not working in room 302",
    desc: "The HP LaserJet in conference room 302 is showing an offline status. Multiple users affected.",
    category: "IT",
    priority: "Medium",
    status: "Resolved",
    createdBy: 4,
    assignedTo: 3,
    created: NOW - 7 * DAY,
    updated: NOW - DAY,
    resolvedAt: NOW - DAY,
    comments: [{ id: 3, author: 3, text: "Replaced the ink cartridge and reset the network connection. Should be working now.", type: "public", time: NOW - DAY }],
  },
  { id: "TKT-004", title: "Request for new employee onboarding software", desc: "We need a software solution to streamline the new employee onboarding process across departments.", category: "Operations", priority: "Low", status: "Open", createdBy: 5, assignedTo: null, created: NOW - 3 * DAY, updated: NOW - 3 * DAY, comments: [] },
  { id: "TKT-005", title: "Email signature not displaying correctly", desc: "HTML signature shows broken layout in Outlook. Works fine in Gmail but client-facing emails look unprofessional.", category: "IT", priority: "Medium", status: "Closed", createdBy: 4, assignedTo: 2, created: NOW - 10 * DAY, updated: NOW - 4 * DAY, resolvedAt: NOW - 4 * DAY, comments: [] },
  { id: "TKT-006", title: "Payroll discrepancy for March", desc: "My March payslip shows incorrect overtime hours. I worked 14 hours overtime but only 8 are reflected.", category: "HR", priority: "High", status: "In Progress", createdBy: 4, assignedTo: 3, created: NOW - DAY, updated: NOW - 12 * 3_600_000, comments: [{ id: 4, author: 3, text: "Checking with HR records system.", type: "internal", time: NOW - 10 * 3_600_000 }] },
  { id: "TKT-007", title: "Database backup failure alert", desc: "Automated backup job failed at 02:00 AM. Logs show disk quota exceeded on backup server.", category: "IT", priority: "High", status: "Open", createdBy: 1, assignedTo: 2, created: NOW - 6 * 3_600_000, updated: NOW - 5 * 3_600_000, comments: [] },
  { id: "TKT-008", title: "Software license renewal reminder", desc: "Adobe Creative Suite licenses expire in 30 days for the design team (12 users). Need approval for renewal.", category: "Operations", priority: "Medium", status: "Open", createdBy: 5, assignedTo: null, created: NOW - 4 * DAY, updated: NOW - 4 * DAY, comments: [] },
  { id: "TKT-009", title: "Slow internet connection - 3rd floor", desc: "Multiple employees on the 3rd floor experiencing very slow internet speeds since yesterday morning.", category: "IT", priority: "Medium", status: "In Progress", createdBy: 4, assignedTo: 3, created: NOW - 2 * DAY, updated: NOW - 8 * 3_600_000, comments: [] },
  { id: "TKT-010", title: "Request refund for duplicate charge", desc: "I was charged twice for the same order #ORD-8821 on March 28. Please issue a refund for the duplicate.", category: "Billing", priority: "High", status: "Resolved", createdBy: 5, assignedTo: 2, created: NOW - 6 * DAY, updated: NOW - 3 * DAY, resolvedAt: NOW - 3 * DAY, comments: [{ id: 5, author: 2, text: "Refund of $49.99 processed. Should reflect in 3-5 business days.", type: "public", time: NOW - 3 * DAY }] },
  { id: "TKT-011", title: "Access request for CRM system", desc: "New sales team member needs access to Salesforce CRM. Account setup form attached.", category: "IT", priority: "Low", status: "Closed", createdBy: 4, assignedTo: 3, created: NOW - 8 * DAY, updated: NOW - 5 * DAY, resolvedAt: NOW - 5 * DAY, comments: [] },
  { id: "TKT-012", title: "Office 365 login loop issue", desc: "After password reset, Office 365 keeps redirecting to login page in a loop without letting me in.", category: "IT", priority: "High", status: "Open", createdBy: 5, assignedTo: null, created: NOW - 3_600_000, updated: NOW - 3_600_000, comments: [] },
];

export type Notification = {
  id: number;
  title: string;
  desc: string;
  time: string;
  read: boolean;
};

export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 1, title: "New ticket assigned", desc: "TKT-007 has been assigned to you", time: "5 min ago", read: false },
  { id: 2, title: "Status update", desc: "TKT-003 has been resolved", time: "1 hour ago", read: false },
  { id: 3, title: "New comment", desc: "Sam Rivera commented on TKT-006", time: "3 hours ago", read: true },
  { id: 4, title: "Ticket escalated", desc: "TKT-001 priority changed to High", time: "1 day ago", read: true },
];

