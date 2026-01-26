"use client";

import { ReactNode } from "react";

interface MobileCardProps {
  children: ReactNode;
  className?: string;
}

export function MobileCard({ children, className = "" }: MobileCardProps) {
  return (
    <div className={`border border-neutral-200 bg-white p-4 space-y-3 ${className}`}>
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
      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 shrink-0">
        {label}
      </span>
      <div className="text-right">{children}</div>
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
      <div className="hidden lg:block border border-neutral-200 bg-white">
        {children}
      </div>
      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {mobileView}
      </div>
    </>
  );
}
