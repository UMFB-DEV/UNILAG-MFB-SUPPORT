"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import type { MainView } from "./obsidian-types";

type NavItem = { id: MainView; label: string };

function mobileIcon(id: MainView) {
  const cls = "h-5 w-5";
  if (id === "dashboard") {
    return (
      <svg
        className={cls}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 13h8V3H3v10z" />
        <path d="M13 21h8V11h-8v10z" />
        <path d="M13 3h8v6h-8V3z" />
        <path d="M3 17h8v4H3v-4z" />
      </svg>
    );
  }
  if (id === "tickets" || id === "my-tickets") {
    return (
      <svg
        className={cls}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </svg>
    );
  }
  if (id === "new-ticket") {
    return (
      <svg
        className={cls}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }
  return (
    <svg
      className={cls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20a8 8 0 1 0-8-8" />
      <path d="M4 12a8 8 0 0 0 8 8" />
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function signOutIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 21V3" />
    </svg>
  );
}

export function ObsidianShell({
  name,
  roleLabel,
  activeView,
  nav,
  onNavigate,
  onSignOut,
  showNewTicketAction = true,
  children,
}: {
  name: string;
  roleLabel: string;
  activeView: MainView;
  nav: NavItem[];
  onNavigate: (view: MainView) => void;
  onSignOut: () => void;
  showNewTicketAction?: boolean;
  children: ReactNode;
}) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const mobileNav = showNewTicketAction
    ? nav
    : nav.filter((i) => i.id !== "new-ticket");

  function handleSignOutClick() {
    setShowSignOutConfirm(true);
  }

  function handleSignOutConfirm() {
    setShowSignOutConfirm(false);
    onSignOut();
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-zinc-100">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-[#1F1F21] bg-[#111111] p-4 md:flex md:flex-col">
        <div className="mb-10 px-2">
          <div className="mb-4 flex flex-col items-start gap-3">
            <img src="/UMFB-LOGO.png" alt="UMFB Logo" className="h-12 w-auto" />
            <h1 className="text-[11px] font-bold uppercase leading-tight tracking-widest text-[#7b3434]">
              UNILAG MFB TICKETING SYSTEM
            </h1>
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            {roleLabel}
          </p>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                activeView === item.id
                  ? "bg-[#1A1A1A] text-[#ACD23C]"
                  : "text-zinc-500 hover:bg-[#1A1A1A] hover:text-zinc-200"
              }`}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-3 border-t border-[#1F1F21] pt-4">
          {showNewTicketAction ? (
            <button
              onClick={() => onNavigate("new-ticket")}
              className="w-full rounded-lg bg-[#7b3434] px-4 py-3 text-sm font-semibold text-white hover:brightness-110"
              type="button"
            >
              New Ticket
            </button>
          ) : null}
          <button
            onClick={handleSignOutClick}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-[#1A1A1A] hover:text-zinc-200"
            type="button"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1F1F21] bg-[#0B0B0C]/85 px-6 backdrop-blur">
          <p className="text-sm font-semibold tracking-wide text-zinc-200">
            Support Portal
          </p>
          <div className="flex items-center gap-3">
            <p className="hidden text-right text-xs text-zinc-400 sm:block">
              <span className="block text-zinc-200">{name}</span>
              {roleLabel}
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1A] text-xs font-bold">
              {name
                .split(" ")
                .filter(Boolean)
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>
        </header>
        <div className="p-6 pb-24 md:p-8 md:pb-8">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1F1F21] bg-[#111111]/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-1">
          {mobileNav.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition ${
                activeView === item.id
                  ? "bg-[#1A1A1A] text-[#ACD23C]"
                  : "text-zinc-400 hover:bg-[#1A1A1A] hover:text-zinc-200"
              }`}
              type="button"
            >
              <span className="mx-auto flex w-full flex-col items-center gap-1">
                {mobileIcon(item.id)}
                <span className="leading-none">{item.label}</span>
              </span>
            </button>
          ))}
          <button
            onClick={handleSignOutClick}
            className="rounded-lg px-2 py-2 text-center text-[11px] font-semibold text-zinc-400 hover:bg-[#1A1A1A] hover:text-zinc-200"
            type="button"
          >
            <span className="mx-auto flex w-full flex-col items-center gap-1">
              {signOutIcon()}
              <span className="leading-none">Sign Out</span>
            </span>
          </button>
        </div>
      </nav>

      {showSignOutConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-md rounded-xl border border-[#1F1F21] bg-[#111111] p-8 shadow-2xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 21h6M12 17v4M3 12a9 9 0 1 1 18 0" />
                  <path d="M12 8v4" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100">Sign Out</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Are you sure you want to sign out?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-lg border border-[#1F1F21] bg-transparent px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-zinc-300 hover:bg-[#1A1A1A]"
                onClick={() => setShowSignOutConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:brightness-110"
                onClick={handleSignOutConfirm}
                type="button"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
