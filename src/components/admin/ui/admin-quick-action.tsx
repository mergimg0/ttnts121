import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminQuickActionProps {
  href: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  className?: string;
}

export function AdminQuickAction({
  href,
  icon: Icon,
  label,
  description,
  className,
}: AdminQuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-4 p-4",
        "rounded-2xl border border-neutral-200/60 bg-white",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-50/0 to-sky-50/0 group-hover:from-sky-50/30 group-hover:to-transparent transition-all duration-500 pointer-events-none" />

      {/* Icon container */}
      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-50 group-hover:bg-sky-50 transition-colors">
        <Icon className="h-5 w-5 text-neutral-500 group-hover:text-sky-600 transition-colors" />
      </div>

      {/* Content */}
      <div className="relative flex-1 min-w-0">
        <span className="block text-sm font-semibold text-neutral-900 group-hover:text-neutral-900">
          {label}
        </span>
        {description && (
          <span className="block text-[13px] text-neutral-500 mt-0.5 truncate">
            {description}
          </span>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight className="relative h-4 w-4 text-neutral-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all duration-300" />
    </Link>
  );
}
