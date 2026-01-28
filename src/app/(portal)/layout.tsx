"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { PortalNav, MobileMenuButton } from "@/components/portal/portal-nav";
import { ToastContainer } from "@/components/ui/toast";
import { Loader2, LogOut, User } from "lucide-react";

function PortalLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut, firebaseUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push("/login?redirect=/portal");
    }
  }, [loading, firebaseUser, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  // Still loading or not authenticated
  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

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
            <Link href="/portal" className="text-lg font-bold tracking-tight">
              TTNS121 <span className="text-sky-500">Portal</span>
            </Link>
          </div>
          {/* Email on new line, always visible */}
          <span className="text-[11px] text-neutral-500 truncate max-w-full pl-0 lg:pl-0 mt-0.5">
            {user?.email || firebaseUser?.email}
          </span>
        </div>
        {/* User info and Logout */}
        <div className="flex flex-1 items-center justify-end gap-2 px-4 lg:px-6">
          {user && (
            <span className="hidden sm:inline text-[13px] text-neutral-600 mr-2">
              {user.firstName} {user.lastName}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar - starts below header */}
      <PortalNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="pt-16 lg:pl-64">
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PortalLayoutContent>{children}</PortalLayoutContent>
      <ToastContainer />
    </AuthProvider>
  );
}
