"use client";

import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

interface AdminInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-xl border bg-white px-4 py-2",
              "text-sm text-neutral-900 placeholder:text-neutral-400",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-neutral-200 focus:border-sky-500 focus:ring-sky-500/20",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              props.disabled && "opacity-50 cursor-not-allowed bg-neutral-50",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
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

AdminInput.displayName = "AdminInput";

// Textarea variant
interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const AdminTextarea = forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "flex min-h-[120px] w-full rounded-xl border bg-white px-4 py-3",
            "text-sm text-neutral-900 placeholder:text-neutral-400",
            "transition-all duration-200 resize-none",
            "focus:outline-none focus:ring-2",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-200 focus:border-sky-500 focus:ring-sky-500/20",
            props.disabled && "opacity-50 cursor-not-allowed bg-neutral-50",
            className
          )}
          {...props}
        />
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

AdminTextarea.displayName = "AdminTextarea";
