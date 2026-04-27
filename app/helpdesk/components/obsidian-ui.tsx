import type { ReactNode } from "react";

export function ObsidianCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#1F1F21] bg-[#111111]">
      <div className="flex items-center justify-between border-b border-[#1F1F21] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function MetricTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-[#1F1F21] bg-[#111111] p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-zinc-100">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{note}</p>
    </div>
  );
}

export function StatusPill({
  tone,
  label,
}: {
  tone: "open" | "progress" | "resolved" | "closed" | "high" | "medium" | "low";
  label: string;
}) {
  const toneMap: Record<typeof tone, string> = {
    open: "bg-[#1e3a8a33] text-blue-300 border-blue-500/30",
    progress: "bg-[#92400e33] text-amber-300 border-amber-500/30",
    resolved: "bg-[#14532d33] text-emerald-300 border-emerald-500/30",
    closed: "bg-zinc-700/30 text-zinc-300 border-zinc-500/30",
    high: "bg-red-900/35 text-red-300 border-red-500/30",
    medium: "bg-amber-900/35 text-amber-300 border-amber-500/30",
    low: "bg-emerald-900/35 text-emerald-300 border-emerald-500/30",
  };
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneMap[tone]}`}>{label}</span>;
}

