"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileCardProps {
  children: ReactNode;
  className?: string;
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200/60 bg-white p-3 space-y-2",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileCardRowProps {
  label: string;
  children: ReactNode;
}

export function MobileCardRow({ label, children }: MobileCardRowProps) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 shrink-0">
        {label}
      </span>
      <div className="text-right text-sm text-neutral-900">{children}</div>
    </div>
  );
}

interface ResponsiveTableProps {
  children: ReactNode;
  mobileView: ReactNode;
}

export function ResponsiveTable({ children, mobileView }: ResponsiveTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block rounded-2xl border border-neutral-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {children}
      </div>
      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {mobileView}
      </div>
    </>
  );
}
