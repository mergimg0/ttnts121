"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error("Confirm action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  const variantStyles = {
    danger: {
      icon: "text-red-500",
      iconBg: "bg-red-100",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      icon: "text-amber-500",
      iconBg: "bg-amber-100",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    default: {
      icon: "text-neutral-500",
      iconBg: "bg-neutral-100",
      button: "bg-neutral-900 hover:bg-neutral-800 text-white",
    },
  };

  const styles = variantStyles[variant];

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={handleCancel}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
            >
              {/* Close button */}
              <button
                onClick={handleCancel}
                className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className={`mx-auto w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
              </div>

              {/* Content */}
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{description}</p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="adminSecondary"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${styles.button}`}
                >
                  {isLoading ? "Processing..." : confirmText}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
