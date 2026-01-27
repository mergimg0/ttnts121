import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'info';

interface AdminBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  error: 'bg-red-50 text-red-700 ring-red-600/20',
  neutral: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

export function AdminBadge({
  children,
  variant = 'neutral',
  className,
}: AdminBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-[11px] font-semibold ring-1 ring-inset",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Pre-configured status badges
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'neutral' },
    draft: { label: 'Draft', variant: 'neutral' },
    published: { label: 'Published', variant: 'success' },
    paid: { label: 'Paid', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    cancelled: { label: 'Cancelled', variant: 'error' },
    confirmed: { label: 'Confirmed', variant: 'success' },
    contacted: { label: 'Contacted', variant: 'info' },
    waiting: { label: 'Waiting', variant: 'warning' },
  };

  const config = statusMap[status.toLowerCase()] || { label: status, variant: 'neutral' as BadgeVariant };

  return <AdminBadge variant={config.variant}>{config.label}</AdminBadge>;
}
