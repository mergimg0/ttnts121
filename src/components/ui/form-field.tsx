"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, className, required, ...props }, ref) => {
    const id = props.id || props.name;

    return (
      <div className="space-y-1">
        <label
          htmlFor={id}
          className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full border px-4 py-3 text-sm transition-colors focus:outline-none",
            error
              ? "border-red-500 focus:border-red-500 bg-red-50"
              : "border-neutral-300 focus:border-black",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-neutral-500 mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, hint, className, required, ...props }, ref) => {
    const id = props.id || props.name;

    return (
      <div className="space-y-1">
        <label
          htmlFor={id}
          className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "w-full border px-4 py-3 text-sm transition-colors focus:outline-none resize-none",
            error
              ? "border-red-500 focus:border-red-500 bg-red-50"
              : "border-neutral-300 focus:border-black",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-neutral-500 mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";

interface FormSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, hint, className, required, children, ...props }, ref) => {
    const id = props.id || props.name;

    return (
      <div className="space-y-1">
        <label
          htmlFor={id}
          className="block text-xs font-bold uppercase tracking-wider text-neutral-500"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full border px-4 py-3 text-sm transition-colors focus:outline-none",
            error
              ? "border-red-500 focus:border-red-500 bg-red-50"
              : "border-neutral-300 focus:border-black",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-neutral-500 mt-1">{hint}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";
