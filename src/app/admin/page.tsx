"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/admin/stats-card";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminQuickAction } from "@/components/admin/ui/admin-quick-action";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminStatsSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CreditCard,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  ClipboardList,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { DashboardStats } from "@/types/booking";
import { formatPrice } from "@/lib/booking-utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || "Failed to load stats");
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-neutral-100 rounded-lg animate-pulse" />
        <AdminStatsSkeleton />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Dashboard"
          subtitle="Welcome back. Here's your overview."
        />
        <AdminCard hover={false}>
          <div className="py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-neutral-900 font-medium mb-2">Failed to load dashboard</p>
            <p className="text-neutral-500 text-sm mb-4">{error}</p>
            <Button variant="outline" onClick={fetchStats}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Dashboard"
        subtitle="Welcome back. Here's your overview."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="h-9"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="adminPrimary" asChild>
            <Link href="/admin/programs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Program
            </Link>
          </Button>
        </div>
      </AdminPageHeader>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          description="This month"
          icon={CreditCard}
        />
        <StatsCard
          title="Revenue"
          value={formatPrice(stats?.totalRevenue || 0)}
          description="This month"
          icon={TrendingUp}
        />
        <StatsCard
          title="Upcoming Sessions"
          value={stats?.upcomingSessions || 0}
          description="Next 7 days"
          icon={Calendar}
        />
        <StatsCard
          title="Waitlist"
          value={stats?.waitlistCount || 0}
          description="Awaiting spots"
          icon={Users}
        />
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <AdminCard hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-neutral-900">
              Recent Bookings
            </h2>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-500 hover:text-sky-600 transition-colors"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentBookings && stats.recentBookings.length > 0 ? (
              stats.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border-b border-neutral-50 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {booking.childFirstName} {booking.childLastName}
                    </p>
                    <p className="text-[13px] text-neutral-500">
                      {booking.parentEmail}
                    </p>
                  </div>
                  <AdminBadge
                    variant={booking.paymentStatus === "paid" ? "success" : "warning"}
                  >
                    {booking.paymentStatus === "paid" ? "Paid" : "Pending"}
                  </AdminBadge>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 mx-auto mb-3">
                  <CreditCard className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-neutral-500 text-sm">No recent bookings</p>
              </div>
            )}
          </div>
        </AdminCard>

        {/* Quick Actions */}
        <AdminCard hover={false}>
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <AdminQuickAction
              href="/admin/programs/new"
              icon={Plus}
              label="Create New Program"
              description="Set up a new coaching program"
            />
            <AdminQuickAction
              href="/admin/sessions"
              icon={ClipboardList}
              label="Manage Sessions"
              description="View and edit upcoming sessions"
            />
            <AdminQuickAction
              href="/admin/bookings"
              icon={CreditCard}
              label="View Bookings"
              description="See all customer bookings"
            />
            <AdminQuickAction
              href="/admin/waitlist"
              icon={Users}
              label="Waitlist"
              description="Manage waitlist entries"
            />
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
