"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { CreditCard, Eye, Download } from "lucide-react";
import { Booking } from "@/types/booking";
import { formatPrice, toDate } from "@/lib/booking-utils";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/admin/bookings");
      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.paymentStatus === filter;
  });

  const exportToCSV = () => {
    const headers = [
      "Booking Ref",
      "Child Name",
      "Parent Name",
      "Email",
      "Phone",
      "Session",
      "Payment Status",
      "Amount",
      "Date",
    ];

    const rows = filteredBookings.map((b) => [
      b.bookingRef,
      `${b.childFirstName} ${b.childLastName}`,
      `${b.parentFirstName} ${b.parentLastName}`,
      b.parentEmail,
      b.parentPhone,
      b.sessionId,
      b.paymentStatus,
      formatPrice(b.amount),
      toDate(b.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Bookings"
          subtitle="Loading..."
        />
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Bookings"
        subtitle={`${bookings.length} total bookings`}
      >
        <Button variant="adminSecondary" onClick={exportToCSV} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </AdminPageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "paid", "pending", "failed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-[13px] font-medium rounded-xl transition-all duration-200 ${
              filter === status
                ? "bg-navy text-white shadow-sm"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <AdminEmptyState
          icon={CreditCard}
          title="No bookings found"
          description={
            filter === "all"
              ? "Bookings will appear here once parents register"
              : `No ${filter} bookings found`
          }
        />
      ) : (
        <ResponsiveTable
          mobileView={
            filteredBookings.map((booking) => (
              <MobileCard key={booking.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[13px] font-medium text-neutral-600">
                      {booking.bookingRef}
                    </span>
                    <p className="text-sm font-medium text-neutral-900 mt-1">
                      {booking.childFirstName} {booking.childLastName}
                    </p>
                  </div>
                  <AdminBadge
                    variant={
                      booking.paymentStatus === "paid"
                        ? "success"
                        : booking.paymentStatus === "pending"
                          ? "warning"
                          : "error"
                    }
                  >
                    {booking.paymentStatus}
                  </AdminBadge>
                </div>
                <MobileCardRow label="Parent">
                  <p className="text-sm text-neutral-600">
                    {booking.parentFirstName} {booking.parentLastName}
                  </p>
                </MobileCardRow>
                <MobileCardRow label="Amount">
                  <span className="text-sm font-semibold tabular-nums">{formatPrice(booking.amount)}</span>
                </MobileCardRow>
                <MobileCardRow label="Date">
                  <span className="text-[13px] text-neutral-500">
                    {booking.createdAt ? toDate(booking.createdAt).toLocaleDateString() : "-"}
                  </span>
                </MobileCardRow>
                <div className="pt-3 border-t border-neutral-100">
                  <Button variant="adminSecondary" size="sm" asChild className="w-full">
                    <Link href={`/admin/bookings/${booking.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </MobileCard>
            ))
          }
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Child
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Parent
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="group hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-mono text-[13px] font-medium text-neutral-600">
                      {booking.bookingRef}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {booking.childFirstName} {booking.childLastName}
                      </p>
                      <p className="text-[13px] text-neutral-500">
                        {booking.ageGroup}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-neutral-600">
                        {booking.parentFirstName} {booking.parentLastName}
                      </p>
                      <p className="text-[13px] text-neutral-500">
                        {booking.parentEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold tabular-nums text-neutral-900">
                      {formatPrice(booking.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <AdminBadge
                      variant={
                        booking.paymentStatus === "paid"
                          ? "success"
                          : booking.paymentStatus === "pending"
                            ? "warning"
                            : "error"
                      }
                    >
                      {booking.paymentStatus}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-4 text-[13px] text-neutral-500">
                    {booking.createdAt
                      ? toDate(booking.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100 inline-flex"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
