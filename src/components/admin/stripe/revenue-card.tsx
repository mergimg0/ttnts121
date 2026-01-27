"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface RevenueCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: {
    value: number;
    positive: boolean;
  };
  icon: LucideIcon;
  className?: string;
}

export function RevenueCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  className,
}: RevenueCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white p-6",
        "border border-neutral-200/60",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-sky-50/0 group-hover:from-sky-50/30 group-hover:to-transparent transition-all duration-500" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-medium text-neutral-500 tracking-wide">
            {title}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 group-hover:bg-sky-50 transition-colors">
            <Icon className="h-[18px] w-[18px] text-neutral-400 group-hover:text-sky-500 transition-colors" />
          </div>
        </div>

        {/* Value */}
        <div className="mb-1">
          <span className="text-[32px] font-semibold tracking-tight text-neutral-900 tabular-nums">
            {value}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2">
          {change && (
            <span
              className={cn(
                "inline-flex items-center text-[13px] font-medium tabular-nums",
                change.positive ? "text-emerald-600" : "text-red-500"
              )}
            >
              {change.positive ? "+" : ""}{change.value}%
            </span>
          )}
          {subtitle && (
            <span className="text-[13px] text-neutral-400">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
