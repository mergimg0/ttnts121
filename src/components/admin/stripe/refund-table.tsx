"use client";

import { RefundRecord } from "@/types/stripe";
import { formatPrice } from "@/lib/booking-utils";
import { cn } from "@/lib/utils";

interface RefundTableProps {
  refunds: RefundRecord[];
  loading?: boolean;
}

const reasonLabels: Record<string, string> = {
  duplicate: 'Duplicate',
  fraudulent: 'Fraudulent',
  requested_by_customer: 'Customer Request',
};

export function RefundTable({ refunds, loading }: RefundTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-neutral-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (refunds.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-neutral-500 text-sm">No refunds processed</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {refunds.map((refund) => (
        <div
          key={refund.id}
          className="flex items-center justify-between p-4 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "h-2 w-2 rounded-full flex-shrink-0",
                refund.status === 'succeeded' ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {refund.customerEmail || 'Unknown customer'}
              </p>
              <p className="text-[13px] text-neutral-500">
                {reasonLabels[refund.reason || ''] || 'Refund processed'}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold tabular-nums text-neutral-900">
              -{formatPrice(refund.amount)}
            </p>
            <p className="text-[12px] text-neutral-400">
              {new Date(refund.created * 1000).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
