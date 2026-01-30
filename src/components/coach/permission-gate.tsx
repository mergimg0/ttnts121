"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { CoachPermissions } from "@/types/user";
import { ShieldX } from "lucide-react";

interface PermissionGateProps {
  permission: keyof CoachPermissions;
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function PermissionGate({
  permission,
  children,
  fallback,
  redirectTo,
}: PermissionGateProps) {
  const { hasCoachPermission, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <LoadingSpinner />;
  }

  const hasPermission = hasCoachPermission(permission);

  if (!hasPermission) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }

    return fallback || <AccessDenied permission={permission} />;
  }

  return <>{children}</>;
}

// Default access denied component
function AccessDenied({ permission }: { permission: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <ShieldX className="h-16 w-16 text-neutral-300 mb-4" />
      <h2 className="text-xl font-semibold text-neutral-900 mb-2">
        Access Restricted
      </h2>
      <p className="text-neutral-500 max-w-md">
        You don&apos;t have permission to access this feature.
        Contact an administrator if you believe this is an error.
      </p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full" />
    </div>
  );
}
