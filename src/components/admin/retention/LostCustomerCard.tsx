"use client";

import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { Button } from "@/components/ui/button";
import {
  LostCustomerSummary,
  LostCustomerStatus,
  LOST_CUSTOMER_STATUS_LABELS,
  LOST_REASON_LABELS,
  PRIORITY_LABELS,
  LostReason,
  isFollowUpOverdue,
} from "@/types/retention";
import {
  Phone,
  Calendar,
  MessageSquare,
  UserCheck,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

interface LostCustomerCardProps {
  customer: LostCustomerSummary;
  onAddFollowUp: (customerId: string) => void;
  onScheduleCall: (customerId: string) => void;
  onMarkReturned: (customerId: string) => void;
  onViewDetails?: (customerId: string) => void;
}

export function LostCustomerCard({
  customer,
  onAddFollowUp,
  onScheduleCall,
  onMarkReturned,
  onViewDetails,
}: LostCustomerCardProps) {
  const isOverdue = isFollowUpOverdue(customer.catchUpDate);
  const showActions = customer.status !== "returned" && customer.status !== "declined";

  return (
    <div className="group rounded-xl lg:rounded-2xl border border-neutral-200/60 bg-white p-4 lg:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-neutral-900 truncate">
              {customer.studentName}
            </h3>
            <PriorityIndicator priority={customer.priority} />
          </div>
          <p className="text-sm text-neutral-500 truncate">
            Parent: {customer.parentName}
          </p>
          <p className="text-[13px] text-neutral-400 truncate">
            {customer.parentEmail}
          </p>
        </div>
        <StatusBadge status={customer.status} />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <InfoItem
          icon={Clock}
          label="Days Since Lost"
          value={`${customer.daysSinceLost} days`}
          highlight={customer.daysSinceLost > 60}
        />
        <InfoItem
          icon={MessageSquare}
          label="Follow-ups"
          value={customer.totalFollowUps.toString()}
        />
        {customer.lastSessionDate && (
          <InfoItem
            icon={Calendar}
            label="Last Session"
            value={formatDate(customer.lastSessionDate)}
          />
        )}
        {customer.daysSinceContact !== undefined && (
          <InfoItem
            icon={Phone}
            label="Last Contact"
            value={customer.daysSinceContact === 0 ? "Today" : `${customer.daysSinceContact} days ago`}
          />
        )}
      </div>

      {/* Reason */}
      {customer.lostReason && (
        <div className="mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Reason:{" "}
          </span>
          <span className="text-sm text-neutral-700">
            {LOST_REASON_LABELS[customer.lostReason]}
          </span>
        </div>
      )}

      {/* Scheduled Follow-up */}
      {customer.catchUpDate && (
        <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 ${
          isOverdue ? "bg-red-50" : "bg-amber-50"
        }`}>
          {isOverdue ? (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          ) : (
            <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
          )}
          <span className={`text-sm ${isOverdue ? "text-red-700" : "text-amber-700"}`}>
            {isOverdue ? "Overdue: " : "Scheduled: "}
            {formatDate(customer.catchUpDate)}
          </span>
        </div>
      )}

      {/* Notes */}
      {customer.nextStepNotes && (
        <div className="bg-neutral-50 rounded-lg p-3 mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Notes
          </p>
          <p className="text-sm text-neutral-700 line-clamp-2">
            {customer.nextStepNotes}
          </p>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-100">
          <Button
            variant="adminSecondary"
            size="sm"
            onClick={() => onAddFollowUp(customer.id)}
            className="flex-1 min-w-[100px]"
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Follow-up
          </Button>
          <Button
            variant="adminSecondary"
            size="sm"
            onClick={() => onScheduleCall(customer.id)}
            className="flex-1 min-w-[100px]"
          >
            <Phone className="h-4 w-4 mr-1.5" />
            Schedule Call
          </Button>
          <Button
            variant="adminPrimary"
            size="sm"
            onClick={() => onMarkReturned(customer.id)}
            className="flex-1 min-w-[100px]"
          >
            <UserCheck className="h-4 w-4 mr-1.5" />
            Returned
          </Button>
        </div>
      )}

      {/* View Details Link */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(customer.id)}
          className="flex items-center justify-center gap-1 w-full mt-3 pt-3 border-t border-neutral-100 text-sm text-sky-600 hover:text-sky-700 transition-colors"
        >
          View Full History
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LostCustomerStatus }) {
  const variantMap: Record<LostCustomerStatus, "success" | "warning" | "error" | "neutral" | "info"> = {
    lost: "error",
    follow_up_scheduled: "warning",
    contacted: "info",
    returning: "success",
    returned: "success",
    declined: "neutral",
  };

  return (
    <AdminBadge variant={variantMap[status]}>
      {LOST_CUSTOMER_STATUS_LABELS[status]}
    </AdminBadge>
  );
}

function PriorityIndicator({ priority }: { priority: number }) {
  if (priority > 1) return null;

  return (
    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
      !
    </span>
  );
}

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}

function InfoItem({ icon: Icon, label, value, highlight }: InfoItemProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${highlight ? "text-amber-500" : "text-neutral-400"}`} />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          {label}
        </p>
        <p className={`text-sm truncate ${highlight ? "text-amber-700 font-medium" : "text-neutral-700"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
