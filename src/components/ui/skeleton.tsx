"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-100 rounded-lg",
        className
      )}
    />
  );
}

// Session Card Skeleton
export function SessionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-5 w-48 mb-2 rounded-lg" />
          <Skeleton className="h-4 w-32 mb-4 rounded-lg" />
          <div className="flex flex-wrap gap-2 mb-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-lg" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-6 w-16 mb-2 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Sessions Page Skeleton
export function SessionsPageSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Admin Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-neutral-50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton className="h-4 w-full max-w-[120px] rounded-lg" />
        </td>
      ))}
    </tr>
  );
}

// Admin Table Skeleton
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-neutral-100">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-3 w-20 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-24 mb-2 rounded-lg" />
      <Skeleton className="h-3 w-16 rounded" />
    </div>
  );
}

// Admin Dashboard Stats Skeleton
export function AdminStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Calendar Skeleton
export function CalendarSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </div>
      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-4 w-full rounded" />
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Cart Item Skeleton
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 py-4 border-b border-neutral-100">
      <Skeleton className="h-16 w-16 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2 rounded-lg" />
        <Skeleton className="h-3 w-24 mb-2 rounded" />
        <Skeleton className="h-4 w-16 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-8 rounded-xl" />
    </div>
  );
}
