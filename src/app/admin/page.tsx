"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/admin/stats-card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CreditCard,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { DashboardStats, Booking } from "@/types/booking";
import { formatPrice } from "@/lib/booking-utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, use mock data. Will be replaced with actual API call
    const mockStats: DashboardStats = {
      totalBookings: 47,
      totalRevenue: 128500, // in pence
      upcomingSessions: 12,
      waitlistCount: 8,
      recentBookings: [],
    };
    setStats(mockStats);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-neutral-200 rounded" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-black">
            Dashboard
          </h1>
          <p className="text-neutral-500">Welcome back. Here&apos;s your overview.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/admin/programs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Program
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <div className="border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold uppercase tracking-wide text-black">
              Recent Bookings
            </h2>
            <Link
              href="/admin/bookings"
              className="text-sm font-medium text-neutral-500 hover:text-black flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentBookings && stats.recentBookings.length > 0 ? (
              stats.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {booking.childFirstName} {booking.childLastName}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {booking.parentEmail}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold uppercase ${
                      booking.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {booking.paymentStatus}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 text-sm py-4 text-center">
                No recent bookings
              </p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="border border-neutral-200 bg-white p-6">
          <h2 className="font-bold uppercase tracking-wide text-black mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/programs/new"
              className="flex items-center justify-between border border-neutral-200 p-4 hover:border-black transition-colors"
            >
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5 text-neutral-400" />
                <span className="font-medium">Create New Program</span>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
            </Link>
            <Link
              href="/admin/sessions"
              className="flex items-center justify-between border border-neutral-200 p-4 hover:border-black transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-neutral-400" />
                <span className="font-medium">Manage Sessions</span>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
            </Link>
            <Link
              href="/admin/bookings"
              className="flex items-center justify-between border border-neutral-200 p-4 hover:border-black transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-neutral-400" />
                <span className="font-medium">View Bookings</span>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
