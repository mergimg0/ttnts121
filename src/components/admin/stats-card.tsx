import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl lg:rounded-2xl bg-white p-3 lg:p-6",
        "border border-neutral-200/60",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-sky-50/0 group-hover:from-sky-50/30 group-hover:to-transparent transition-all duration-500" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 lg:mb-4">
          <span className="text-[11px] lg:text-[13px] font-medium text-neutral-500 tracking-wide">
            {title}
          </span>
          <div className="flex h-6 w-6 lg:h-9 lg:w-9 items-center justify-center rounded-lg lg:rounded-xl bg-neutral-50 group-hover:bg-sky-50 transition-colors">
            <Icon className="h-3.5 w-3.5 lg:h-[18px] lg:w-[18px] text-neutral-400 group-hover:text-sky-500 transition-colors" />
          </div>
        </div>

        {/* Value */}
        <div className="mb-0.5 lg:mb-1">
          <span className="text-lg lg:text-[32px] font-semibold tracking-tight text-neutral-900 tabular-nums">
            {value}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1 lg:gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center text-[11px] lg:text-[13px] font-medium tabular-nums",
                trend.positive ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend.positive ? "+" : ""}{trend.value}%
            </span>
          )}
          {description && (
            <span className="text-[10px] lg:text-[13px] text-neutral-400">
              {description}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
