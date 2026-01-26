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
        "border border-neutral-200 bg-white p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black text-black">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-2 text-sm font-medium",
                trend.positive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.positive ? "+" : "-"}
              {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center border border-neutral-200">
          <Icon className="h-6 w-6 text-neutral-400" />
        </div>
      </div>
    </div>
  );
}
