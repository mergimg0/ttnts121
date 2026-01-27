"use client";

import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

// Table wrapper with Apple styling
interface AdminTableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function AdminTable({ children, className, ...props }: AdminTableProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/60 bg-white",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </div>
  );
}

// Table header
interface AdminTableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function AdminTableHead({ children, className, ...props }: AdminTableHeadProps) {
  return (
    <thead className={cn("border-b border-neutral-100", className)} {...props}>
      {children}
    </thead>
  );
}

// Table header cell
interface AdminTableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export function AdminTableHeader({ children, className, ...props }: AdminTableHeaderProps) {
  return (
    <th
      className={cn(
        "text-left py-3 px-4",
        "text-[11px] font-semibold uppercase tracking-wider text-neutral-400",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

// Table body
interface AdminTableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function AdminTableBody({ children, className, ...props }: AdminTableBodyProps) {
  return (
    <tbody className={cn("divide-y divide-neutral-50", className)} {...props}>
      {children}
    </tbody>
  );
}

// Table row
interface AdminTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  clickable?: boolean;
}

export function AdminTableRow({ children, className, clickable = false, ...props }: AdminTableRowProps) {
  return (
    <tr
      className={cn(
        "group hover:bg-neutral-50/50 transition-colors",
        clickable && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

// Table cell
interface AdminTableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export function AdminTableCell({ children, className, ...props }: AdminTableCellProps) {
  return (
    <td className={cn("py-4 px-4", className)} {...props}>
      {children}
    </td>
  );
}

// Export all as a namespace for convenient imports
export const Table = {
  Root: AdminTable,
  Head: AdminTableHead,
  Header: AdminTableHeader,
  Body: AdminTableBody,
  Row: AdminTableRow,
  Cell: AdminTableCell,
};
