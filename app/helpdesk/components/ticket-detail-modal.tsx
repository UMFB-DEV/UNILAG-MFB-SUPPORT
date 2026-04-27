"use client";

import { useMemo, useState } from "react";

import type { Ticket, TicketStatus, User } from "@/lib/helpdesk/demoData";

import { useCreateTicketCommentMutation, useTicketCommentsQuery } from "@/services/tickets/hooks";

import { StatusPill } from "./obsidian-ui";

function toneFromStatus(status: TicketStatus): "open" | "progress" | "resolved" | "closed" {
  if (status === "Open") return "open";
  if (status === "In Progress") return "progress";
  if (status === "Resolved") return "resolved";
  return "closed";
}

export function TicketDetailModal({
  ticket,
  token,
  users,
  canComment,
  canInternalComment,
  canTakeTicket,
  takeTicketPending,
  takeTicketError,
  onTakeTicket,
  canUpdateStatus,
  updateStatusPending,
  updateStatusError,
  onClose,
  onUpdateStatus,
}: {
  ticket: Ticket;
  token: string | null;
  users: User[];
  canComment: boolean;
  canInternalComment: boolean;
  canTakeTicket?: boolean;
  takeTicketPending?: boolean;
  takeTicketError?: string | null;
  onTakeTicket?: (ticketId: string) => void | Promise<void>;
  canUpdateStatus?: boolean;
  updateStatusPending?: boolean;
  updateStatusError?: string | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: TicketStatus) => void | Promise<void>;
}) {
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);

  const blockCommentsUntilAssigned = Boolean(canTakeTicket) && !ticket.assignedTo;

  const commentsQuery = useTicketCommentsQuery({
    token,
    ticketId: ticket.id,
    enabled: Boolean(token) && !blockCommentsUntilAssigned,
  });

  const createCommentMutation = useCreateTicketCommentMutation({ token });

  const visibleComments = useMemo(() => {
    const all = commentsQuery.data?.data ?? [];
    if (canInternalComment) return all;
    return all.filter((c) => !c.isInternal);
  }, [commentsQuery.data, canInternalComment]);

  const displayedComments = useMemo(() => {
    if (showAllMessages) return visibleComments;
    return visibleComments.slice(0, 3);
  }, [visibleComments, showAllMessages]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl border border-[#2A2A2C] bg-[#111111]">
        <div className="flex items-start justify-between border-b border-[#1F1F21] px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{ticket.id}</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-100">{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg border border-[#2A2A2C] px-3 py-1 text-sm text-zinc-300 hover:bg-[#1A1A1A]" type="button">
            Close
          </button>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-5">
            <p className="text-sm leading-6 text-zinc-300">{ticket.desc}</p>
            <div className="rounded-lg border border-[#1F1F21] bg-[#0F0F10] p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-100">Thread</h3>
              <div className="space-y-3">
                {blockCommentsUntilAssigned ? (
                  <p className="text-sm text-zinc-500">Can't show messages unless assigned.</p>
                ) : commentsQuery.isLoading ? (
                  <p className="text-sm text-zinc-500">Loading messages...</p>
                ) : commentsQuery.isError ? (
                  <p className="text-sm text-zinc-500">Failed to load messages.</p>
                ) : visibleComments.length === 0 ? (
                  <p className="text-sm text-zinc-500">No messages yet.</p>
                ) : (
                  displayedComments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-lg border p-3 ${c.isInternal ? "border-amber-600/25 bg-amber-900/10" : "border-[#1F1F21] bg-[#111111]"}`}
                    >
                      <p className="text-xs text-zinc-500">
                        {c.user.name ?? c.user.email.split("@")[0]} • {c.isInternal ? "Internal" : "Public"}
                      </p>
                      <p className="mt-1 text-sm text-zinc-200">{c.message}</p>
                    </div>
                  ))
                )}
              </div>
              {!blockCommentsUntilAssigned && !commentsQuery.isLoading && !commentsQuery.isError && visibleComments.length > 3 ? (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAllMessages((p) => !p)}
                    className="text-xs font-semibold text-[#D4A373] hover:brightness-110"
                  >
                    {showAllMessages ? "Show less" : "Load more"}
                  </button>
                </div>
              ) : null}
              {canComment ? (
                <div className="mt-4 space-y-3">
                  {commentError ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                      {commentError}
                    </div>
                  ) : null}
                  {createCommentMutation.isPending ? (
                    <p className="text-xs text-zinc-500">Sending comment...</p>
                  ) : null}
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] p-3 text-sm text-zinc-100 outline-none focus:border-[#D4A373]"
                    rows={3}
                    placeholder="Write a reply..."
                    disabled={createCommentMutation.isPending}
                  />
                  <div className="flex items-center justify-between">
                    {canInternalComment ? (
                      <label className="text-xs text-zinc-400">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={internal}
                          onChange={(e) => setInternal(e.target.checked)}
                          disabled={createCommentMutation.isPending}
                        />
                        Internal note
                      </label>
                    ) : <span />}
                    <button
                      onClick={async () => {
                        setCommentError(null);
                        const v = text.trim();
                        if (!v) return;
                        if (createCommentMutation.isPending) return;
                        try {
                          await createCommentMutation.mutateAsync({
                            ticketId: ticket.id,
                            input: {
                              message: v,
                              isInternal: canInternalComment ? internal : false,
                            },
                          });
                          setText("");
                          setInternal(false);
                        } catch (e) {
                          if (e && typeof e === "object") {
                            const maybe = e as { status?: unknown; message?: unknown };
                            const status = typeof maybe.status === "number" ? maybe.status : null;
                            const message = typeof maybe.message === "string" ? maybe.message : null;
                            setCommentError(
                              status && status >= 500
                                ? "Something went wrong. Please try again."
                                : message ?? "Something went wrong. Please try again.",
                            );
                            return;
                          }
                          setCommentError("Something went wrong. Please try again.");
                        }
                      }}
                      className="rounded-lg bg-[#D4A373] px-4 py-2 text-sm font-semibold text-[#111111] disabled:opacity-60"
                      type="button"
                      disabled={createCommentMutation.isPending}
                    >
                      {createCommentMutation.isPending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="space-y-4 rounded-lg border border-[#1F1F21] bg-[#0F0F10] p-4">
            <h3 className="text-sm font-semibold text-zinc-100">Ticket Meta</h3>
            <div className="space-y-2 text-sm">
              <p className="text-zinc-400">Department</p>
              <p className="text-zinc-200">{ticket.category}</p>
            </div>
            {canTakeTicket ? (
              <div className="space-y-2">
                {takeTicketError ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                    {takeTicketError}
                  </div>
                ) : null}
                <button
                  onClick={() => onTakeTicket?.(ticket.id)}
                  className="w-full rounded-lg bg-[#D4A373] px-4 py-2 text-sm font-semibold text-[#111111] disabled:opacity-60"
                  type="button"
                  disabled={Boolean(takeTicketPending)}
                >
                  {takeTicketPending ? "Taking..." : "Take Ticket"}
                </button>
              </div>
            ) : null}
            <div className="space-y-2 text-sm">
              <p className="text-zinc-400">Status</p>
              <StatusPill tone={toneFromStatus(ticket.status)} label={ticket.status} />
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-zinc-400">Created by</p>
              <p className="text-zinc-200">{userMap.get(ticket.createdBy) ?? "Unknown"}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-zinc-400">Assigned to</p>
              <p className="text-zinc-200">{ticket.assignedTo ? userMap.get(ticket.assignedTo) : "Unassigned"}</p>
            </div>
            {canUpdateStatus ? (
              <div className="space-y-2 pt-2">
                <p className="text-sm text-zinc-400">Update status</p>
                {updateStatusPending ? (
                  <p className="text-xs text-zinc-500">Updating…</p>
                ) : null}
                {updateStatusError ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                    {updateStatusError}
                  </div>
                ) : null}
                <select
                  value={ticket.status}
                  onChange={(e) => onUpdateStatus(ticket.id, e.target.value as TicketStatus)}
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#111111] p-2 text-sm text-zinc-100 outline-none focus:border-[#D4A373]"
                  disabled={Boolean(updateStatusPending)}
                >
                  <option disabled={ticket.status !== "Open"}>Open</option>
                  <option disabled={ticket.status === "Resolved" || ticket.status === "Closed"}>In Progress</option>
                  <option disabled={ticket.status === "Closed"}>Resolved</option>
                  <option>Closed</option>
                </select>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

