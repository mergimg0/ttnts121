"use client";

import { AdminCard } from "@/components/admin/ui/admin-card";
import {
  RetentionMetrics as RetentionMetricsType,
  LOST_CUSTOMER_STATUS_LABELS,
  LOST_REASON_LABELS,
  LostCustomerStatus,
  LostReason,
} from "@/types/retention";
import { Users, UserCheck, UserX, Clock, TrendingUp } from "lucide-react";

interface RetentionMetricsProps {
  metrics: RetentionMetricsType;
}

export function RetentionMetrics({ metrics }: RetentionMetricsProps) {
  // Calculate the gauge percentage (capped at 100)
  const returnRateAngle = Math.min(metrics.returnRate, 100) * 1.8; // 180 degree arc

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          label="Total Lost"
          value={metrics.totalLost}
        />
        <StatCard
          icon={UserCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          label="Returned"
          value={metrics.totalReturned}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          label="Return Rate"
          value={`${metrics.returnRate}%`}
        />
        <StatCard
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          label="Needs Follow-up"
          value={metrics.needsFollowUp}
          highlight={metrics.needsFollowUp > 0}
        />
      </div>

      {/* Breakdown Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Status */}
        <AdminCard hover={false}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-4">
            By Status
          </h3>
          <div className="space-y-3">
            {(Object.entries(metrics.byStatus) as [LostCustomerStatus, number][])
              .filter(([, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <StatusBar
                  key={status}
                  label={LOST_CUSTOMER_STATUS_LABELS[status]}
                  count={count}
                  total={metrics.totalLost}
                  color={getStatusBarColor(status)}
                />
              ))}
            {Object.values(metrics.byStatus).every((v) => v === 0) && (
              <p className="text-sm text-neutral-400 text-center py-4">No data yet</p>
            )}
          </div>
        </AdminCard>

        {/* By Reason */}
        <AdminCard hover={false}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-4">
            By Reason
          </h3>
          <div className="space-y-3">
            {(Object.entries(metrics.byReason) as [LostReason, number][])
              .filter(([, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([reason, count]) => (
                <StatusBar
                  key={reason}
                  label={LOST_REASON_LABELS[reason]}
                  count={count}
                  total={metrics.totalLost}
                  color="bg-neutral-500"
                />
              ))}
            {Object.values(metrics.byReason).every((v) => v === 0) && (
              <p className="text-sm text-neutral-400 text-center py-4">No data yet</p>
            )}
          </div>
        </AdminCard>
      </div>

      {/* Monthly Summary */}
      <div className="grid lg:grid-cols-3 gap-4">
        <MiniStatCard label="Lost This Month" value={metrics.lostThisMonth} />
        <MiniStatCard label="Returned This Month" value={metrics.returnedThisMonth} />
        <MiniStatCard label="Declined" value={metrics.totalDeclined} />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, highlight }: StatCardProps) {
  return (
    <AdminCard hover={false}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            {label}
          </p>
          <p className={`text-xl font-bold tabular-nums ${highlight ? "text-amber-600" : "text-neutral-900"}`}>
            {value}
          </p>
        </div>
      </div>
    </AdminCard>
  );
}

function MiniStatCard({ label, value }: { label: string; value: number }) {
  return (
    <AdminCard hover={false} className="!p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums text-neutral-900">{value}</p>
    </AdminCard>
  );
}

interface StatusBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function StatusBar({ label, count, total, color }: StatusBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-neutral-700">{label}</span>
        <span className="text-sm font-medium text-neutral-900 tabular-nums">{count}</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getStatusBarColor(status: LostCustomerStatus): string {
  const colors: Record<LostCustomerStatus, string> = {
    lost: "bg-red-500",
    follow_up_scheduled: "bg-amber-500",
    contacted: "bg-sky-500",
    returning: "bg-green-500",
    returned: "bg-emerald-500",
    declined: "bg-neutral-400",
  };
  return colors[status] || "bg-neutral-500";
}
