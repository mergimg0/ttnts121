"use client";

import { cn } from "@/lib/utils";
import { forwardRef, SelectHTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface AdminSelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options?: AdminSelectOption[];
  placeholder?: string;
  children?: ReactNode;
}

export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ className, label, error, hint, options, placeholder, children, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "flex h-11 w-full appearance-none rounded-xl border bg-white px-4 py-2 pr-10",
              "text-sm text-neutral-900",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-neutral-200 focus:border-sky-500 focus:ring-sky-500/20",
              props.disabled && "opacity-50 cursor-not-allowed bg-neutral-50",
              !props.value && placeholder && "text-neutral-400",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children ? children : (
              options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>
        {error && (
          <p className="text-[13px] text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[13px] text-neutral-500">{hint}</p>
        )}
      </div>
    );
  }
);

AdminSelect.displayName = "AdminSelect";
