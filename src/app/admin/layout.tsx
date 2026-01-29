"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/admin/auth-provider";
import { AdminSidebar, MobileMenuButton } from "@/components/admin/sidebar";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { ToastContainer } from "@/components/ui/toast";
import { Loader2, LogOut } from "lucide-react";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

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
      <header className="fixed top-0 left-0 right-0 z-40 flex h-auto min-h-16 items-center bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Logo section with email below */}
        <div className="flex h-full w-64 flex-shrink-0 flex-col justify-center px-4 lg:px-6 py-2">
          <div className="flex items-center gap-2">
            <div className="mr-2 lg:hidden">
              <MobileMenuButton onClick={() => setSidebarOpen(true)} />
            </div>
            <span className="text-lg font-bold tracking-tight">
              TTNS121 <span className="text-sky-500">Admin</span>
            </span>
          </div>
          {/* Email on new line, always visible */}
          <span className="text-[11px] text-neutral-500 truncate max-w-full pl-0 lg:pl-0 mt-0.5">
            {user?.email}
          </span>
        </div>
        {/* Logout - stays on right, always shows text */}
        <div className="flex flex-1 items-center justify-end gap-2 px-4 lg:px-6">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Tabs - sticky below header with backdrop blur */}
      <div className="fixed top-16 left-0 right-0 z-30 bg-white/80 backdrop-blur-sm border-b border-neutral-200/60">
        <AdminTabs />
      </div>

      {/* Sidebar - starts below header and tabs */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content - account for header (4rem) + tabs (~3rem) */}
      <div className="pt-28 lg:pl-64">
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
      <ToastContainer />
    </AuthProvider>
  );
}
