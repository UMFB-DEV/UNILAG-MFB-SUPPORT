import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-md rounded-xl border border-[#1F1F21] bg-[#111111] p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
      </div>
      {children}
      {footer ? <div className="mt-8 border-t border-[#1F1F21] pt-6">{footer}</div> : null}
    </div>
  );
}

