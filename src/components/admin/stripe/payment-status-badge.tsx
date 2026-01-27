import { cn } from "@/lib/utils";

type PaymentStatus = 'succeeded' | 'pending' | 'failed' | 'canceled' | 'requires_payment_method' | 'processing';

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  succeeded: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  canceled: {
    label: 'Canceled',
    className: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20',
  },
  requires_payment_method: {
    label: 'Action Required',
    className: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  },
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as PaymentStatus] || statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-[11px] font-semibold ring-1 ring-inset",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
