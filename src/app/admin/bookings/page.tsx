"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-black">
              Bookings
            </h1>
            <p className="text-neutral-500">Loading...</p>
          </div>
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-black">
            Bookings
          </h1>
          <p className="text-neutral-500">
            {bookings.length} total bookings
          </p>
        </div>
        <Button variant="secondary" onClick={exportToCSV} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "paid", "pending", "failed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${
              filter === status
                ? "bg-black text-white"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 font-bold text-black">No bookings found</h3>
          <p className="mt-2 text-neutral-500">
            {filter === "all"
              ? "Bookings will appear here once parents register"
              : `No ${filter} bookings found`}
          </p>
        </div>
      ) : (
        <ResponsiveTable
          mobileView={
            filteredBookings.map((booking) => (
              <MobileCard key={booking.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-sm font-medium">
                      {booking.bookingRef}
                    </span>
                    <p className="font-medium text-black mt-1">
                      {booking.childFirstName} {booking.childLastName}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold uppercase ${
                      booking.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : booking.paymentStatus === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {booking.paymentStatus}
                  </span>
                </div>
                <MobileCardRow label="Parent">
                  <p className="text-sm text-neutral-600">
                    {booking.parentFirstName} {booking.parentLastName}
                  </p>
                </MobileCardRow>
                <MobileCardRow label="Amount">
                  <span className="font-medium">{formatPrice(booking.amount)}</span>
                </MobileCardRow>
                <MobileCardRow label="Date">
                  <span className="text-sm text-neutral-600">
                    {booking.createdAt ? toDate(booking.createdAt).toLocaleDateString() : "-"}
                  </span>
                </MobileCardRow>
                <div className="pt-2 border-t border-neutral-100">
                  <Button variant="secondary" size="sm" asChild className="w-full">
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
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Child
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium">
                      {booking.bookingRef}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-black">
                        {booking.childFirstName} {booking.childLastName}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {booking.ageGroup}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-neutral-600">
                        {booking.parentFirstName} {booking.parentLastName}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {booking.parentEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">
                      {formatPrice(booking.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-bold uppercase ${
                        booking.paymentStatus === "paid"
                          ? "bg-green-100 text-green-700"
                          : booking.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {booking.createdAt
                      ? toDate(booking.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/bookings/${booking.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
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
