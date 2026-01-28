"use client";

import { CartRecoveryMetrics } from "@/types/abandoned-cart";
import { formatPrice } from "@/lib/booking-utils";
import { ShoppingCart, Mail, CheckCircle, TrendingUp, DollarSign, BarChart } from "lucide-react";

interface CartRecoveryMetricsCardProps {
  metrics: CartRecoveryMetrics;
}

export function CartRecoveryMetricsCard({ metrics }: CartRecoveryMetricsCardProps) {
  const stats = [
    {
      label: "Total Abandoned",
      value: metrics.totalAbandoned.toString(),
      icon: ShoppingCart,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Emails Sent",
      value: metrics.emailsSent.toString(),
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Recovered",
      value: metrics.recovered.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Recovery Rate",
      value: `${metrics.recoveryRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Revenue Abandoned",
      value: formatPrice(metrics.revenueAbandoned),
      icon: DollarSign,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Revenue Recovered",
      value: formatPrice(metrics.revenueRecovered),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart className="h-5 w-5 text-neutral-400" />
        <h2 className="text-lg font-semibold text-neutral-900">Recovery Metrics</h2>
        <span className="text-[13px] text-neutral-400 ml-auto">Last 30 days</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center p-4 rounded-xl bg-neutral-50"
          >
            <div className={`p-2 rounded-lg ${stat.bgColor} mb-2`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <span className="text-xl font-bold text-neutral-900 tabular-nums">
              {stat.value}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 text-center mt-1">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Additional insights */}
      <div className="mt-6 pt-4 border-t border-neutral-100">
        <div className="flex flex-wrap gap-4 text-[13px]">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Avg. Cart Value:</span>
            <span className="font-semibold text-neutral-900">
              {formatPrice(metrics.averageCartValue)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Potential Revenue Lost:</span>
            <span className="font-semibold text-red-600">
              {formatPrice(metrics.revenueAbandoned - metrics.revenueRecovered)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
