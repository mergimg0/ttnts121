import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
}

export function AdminCard({
  children,
  className,
  hover = true,
  padding = true,
}: AdminCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl lg:rounded-2xl bg-white",
        "border border-neutral-200/60",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        hover && "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
        "transition-all duration-300 ease-out",
        padding && "p-4 lg:p-6",
        className
      )}
    >
      {/* Gradient overlay on hover */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-sky-50/0 group-hover:from-sky-50/30 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

// Simple card without hover effects for static content
export function AdminCardStatic({
  children,
  className,
  padding = true,
}: Omit<AdminCardProps, 'hover'>) {
  return (
    <div
      className={cn(
        "rounded-xl lg:rounded-2xl bg-white",
        "border border-neutral-200/60",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        padding && "p-4 lg:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
