"use client";

import { ReactNode } from "react";
import { useAuth } from "@/components/admin/auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface AdminHeaderProps {
  mobileMenuButton?: ReactNode;
}

export function AdminHeader({ mobileMenuButton }: AdminHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-2">
        {mobileMenuButton}
        {/* Breadcrumb or page title can go here */}
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-600">
          <User className="h-4 w-4" />
          <span className="hidden md:inline">{user?.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-neutral-600 hover:text-black"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
