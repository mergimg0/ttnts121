"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/admin/auth-provider";
import { AdminSidebar, MobileMenuButton } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Loader2, User, LogOut } from "lucide-react";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  // Login page has its own layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Redirect handled by AuthProvider if not logged in
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Full-width header with subtle shadow */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Logo section - aligned with sidebar width */}
        <div className="flex h-full w-64 flex-shrink-0 items-center px-6">
          <div className="mr-4 lg:hidden">
            <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            TTNS121 <span className="text-sky-500">Admin</span>
          </span>
        </div>
        {/* User info section - fills remaining width */}
        <div className="flex flex-1 items-center justify-end gap-2 lg:gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-2 text-[13px] text-neutral-500">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar - starts below header */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="pt-16 lg:pl-64">
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}
