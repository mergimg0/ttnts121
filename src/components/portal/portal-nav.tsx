"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  Menu,
  X,
  ArrowLeft,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/portal",
    icon: LayoutDashboard,
  },
  {
    label: "My Bookings",
    href: "/portal/bookings",
    icon: Calendar,
  },
  {
    label: "Account Settings",
    href: "/portal/settings",
    icon: Settings,
  },
];

interface PortalNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PortalNav({ isOpen, onClose }: PortalNavProps) {
  const pathname = usePathname();

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo - only shown on mobile drawer */}
      <div className="lg:hidden flex h-16 items-center justify-between border-b border-neutral-200 px-6">
        <Link
          href="/portal"
          className="text-lg font-black uppercase tracking-wider"
        >
          TTNS121 <span className="text-sky-500">Portal</span>
        </Link>
        {/* Close button on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-neutral-500 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/portal" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}

        {/* Back to Site - Mobile Only */}
        <div className="lg:hidden pt-4 mt-4 border-t border-neutral-100">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
            Back to Site
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-100 p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Website
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - positioned below fixed header */}
      <aside className="hidden lg:block fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-neutral-200">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
            />
            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 z-50 h-screen w-64 bg-white shadow-[4px_0_12px_rgba(0,0,0,0.06)] overflow-y-auto overscroll-contain"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 text-neutral-600 hover:text-black"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
