"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Shield,
  Clock,
  DollarSign,
  Calendar,
  CalendarDays,
  CheckSquare,
} from "lucide-react";
import { CoachPermissions, FULL_COACH_PERMISSIONS } from "@/types/user";

interface CoachPermissionsData {
  coachId: string;
  coachName: string;
  coachEmail: string;
  permissions: CoachPermissions;
}

interface PermissionConfig {
  key: keyof CoachPermissions;
  label: string;
  description: string;
  icon: React.ElementType;
  alwaysOn?: boolean;
}

const PERMISSION_CONFIGS: PermissionConfig[] = [
  {
    key: "canLogHours",
    label: "Can Log Hours",
    description: "Allow coach to log their working hours",
    icon: Clock,
    alwaysOn: true,
  },
  {
    key: "canViewEarnings",
    label: "Can View Earnings",
    description: "Allow coach to view their earnings and payment history",
    icon: DollarSign,
  },
  {
    key: "canViewSessions",
    label: "Can View Sessions",
    description: "Allow coach to view their assigned sessions",
    icon: Calendar,
  },
  {
    key: "canViewTimetable",
    label: "Can View Timetable",
    description: "Allow coach to view the full timetable",
    icon: CalendarDays,
  },
  {
    key: "canMarkAttendance",
    label: "Can Mark Attendance",
    description: "Allow coach to mark student attendance for sessions",
    icon: CheckSquare,
  },
];

export default function CoachPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const coachId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [coachData, setCoachData] = useState<CoachPermissionsData | null>(null);
  const [permissions, setPermissions] = useState<CoachPermissions>(FULL_COACH_PERMISSIONS);

  // Fetch coach permissions
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/coaches/${coachId}/permissions`);
      const data = await response.json();

      if (data.success) {
        setCoachData(data.data);
        setPermissions(data.data.permissions);
      } else {
        setError(data.error || "Failed to fetch permissions");
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setError("Failed to fetch permissions");
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Toggle a permission
  const togglePermission = (key: keyof CoachPermissions) => {
    // Don't allow toggling canLogHours (always on)
    if (key === "canLogHours") return;

    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    // Clear success message when changing
    setSuccessMessage(null);
  };

  // Save permissions
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/coaches/${coachId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage("Permissions saved successfully");
        // Update local state with response
        if (result.data?.permissions) {
          setPermissions(result.data.permissions);
        }
      } else {
        setError(result.error || "Failed to save permissions");
      }
    } catch (err) {
      console.error("Error saving permissions:", err);
      setError("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Coach Permissions"
          subtitle="Loading..."
        />
        <TableSkeleton rows={5} columns={2} />
      </div>
    );
  }

  // Error state (coach not found)
  if (error && !coachData) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Coach Permissions"
          subtitle="Error loading coach"
        >
          <Button
            variant="adminSecondary"
            onClick={() => router.push("/admin/coaches")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Coaches
          </Button>
        </AdminPageHeader>
        <AdminCard hover={false} className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Coach Permissions"
        subtitle={coachData?.coachName || "Manage permissions"}
      >
        <Button
          variant="adminSecondary"
          onClick={() => router.push("/admin/coaches")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Coaches
        </Button>
      </AdminPageHeader>

      {/* Coach Info Card */}
      <AdminCard hover={false} className="bg-sky-50/50 border-sky-200">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">
              {coachData?.coachName}
            </h3>
            <p className="text-sm text-neutral-500">{coachData?.coachEmail}</p>
          </div>
        </div>
      </AdminCard>

      {/* Error Message */}
      {error && (
        <AdminCard hover={false} className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </AdminCard>
      )}

      {/* Success Message */}
      {successMessage && (
        <AdminCard hover={false} className="bg-green-50 border-green-200">
          <div className="flex items-center gap-3 text-green-700">
            <CheckSquare className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{successMessage}</p>
          </div>
        </AdminCard>
      )}

      {/* Permissions List */}
      <AdminCard hover={false}>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-neutral-900 mb-4">
            Portal Permissions
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            Control what this coach can access in the coach portal.
          </p>

          <div className="space-y-4">
            {PERMISSION_CONFIGS.map((config) => {
              const Icon = config.icon;
              const isEnabled = permissions[config.key];
              const isAlwaysOn = config.alwaysOn;

              return (
                <div
                  key={config.key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    isEnabled
                      ? "bg-sky-50/50 border-sky-200"
                      : "bg-neutral-50 border-neutral-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isEnabled
                          ? "bg-sky-100 text-sky-700"
                          : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {config.label}
                        {isAlwaysOn && (
                          <span className="ml-2 text-xs text-sky-600 font-normal">
                            (Always enabled)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {config.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    disabled={isAlwaysOn}
                    onClick={() => togglePermission(config.key)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                      isEnabled ? "bg-sky-600" : "bg-neutral-300"
                    } ${isAlwaysOn ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <span className="sr-only">Toggle {config.label}</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </AdminCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="adminPrimary"
          onClick={handleSave}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Permissions
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
