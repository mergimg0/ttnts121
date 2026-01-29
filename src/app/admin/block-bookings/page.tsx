"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Search,
  Package,
  Loader2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { AdminCard } from "@/components/admin/ui/admin-card";
import {
  BlockBookingCard,
  DeductSessionDialog,
  AddBlockBookingDialog,
  UsageHistoryDialog,
  RefundDialog,
} from "@/components/admin/block-bookings";
import {
  BlockBookingSummary,
  BlockBookingStatus,
  BLOCK_BOOKING_STATUS_LABELS,
} from "@/types/block-booking";

type FilterStatus = "all" | BlockBookingStatus;

interface StatsData {
  totalActive: number;
  totalSessions: number;
  remainingSessions: number;
  expiringSoon: number;
  revenue: number;
}

export default function BlockBookingsPage() {
  // Data state
  const [bookings, setBookings] = useState<BlockBookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deductDialogOpen, setDeductDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BlockBookingSummary | null>(null);

  // Fetch bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/block-bookings?${params}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.data.blockBookings);
      } else {
        setError(data.error || "Failed to fetch block bookings");
      }
    } catch {
      setError("Failed to fetch block bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Filter bookings by search query
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;

    const query = searchQuery.toLowerCase();
    return bookings.filter(
      (booking) =>
        booking.studentName.toLowerCase().includes(query) ||
        booking.parentName.toLowerCase().includes(query) ||
        booking.parentEmail.toLowerCase().includes(query)
    );
  }, [bookings, searchQuery]);

  // Calculate stats
  const stats: StatsData = useMemo(() => {
    const activeBookings = bookings.filter((b) => b.status === "active");
    return {
      totalActive: activeBookings.length,
      totalSessions: bookings.reduce((sum, b) => sum + b.totalSessions, 0),
      remainingSessions: bookings.reduce((sum, b) => sum + b.remainingSessions, 0),
      expiringSoon: bookings.filter((b) => b.isExpiringSoon && b.status === "active").length,
      revenue: bookings.reduce((sum, b) => sum + b.totalPaid, 0),
    };
  }, [bookings]);

  // Handlers
  const handleDeduct = (booking: BlockBookingSummary) => {
    setSelectedBooking(booking);
    setDeductDialogOpen(true);
  };

  const handleViewHistory = (booking: BlockBookingSummary) => {
    setSelectedBooking(booking);
    setHistoryDialogOpen(true);
  };

  const handleRefund = (booking: BlockBookingSummary) => {
    setSelectedBooking(booking);
    setRefundDialogOpen(true);
  };

  const handleDeductSubmit = async (data: {
    sessionDate: string;
    coachId?: string;
    coachName?: string;
    notes?: string;
  }) => {
    if (!selectedBooking) return;

    const response = await fetch(
      `/api/admin/block-bookings/${selectedBooking.id}/deduct`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to deduct session");
    }

    // Refresh bookings
    await fetchBookings();
  };

  const handleAddSubmit = async (data: {
    studentName: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    totalSessions: number;
    totalPaid: number;
    pricePerSession?: number;
    paymentMethod?: "card" | "cash" | "bank_transfer" | "payment_link";
    expiresAt?: string;
    notes?: string;
    purchasedAt?: string;
  }) => {
    const response = await fetch("/api/admin/block-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to create block booking");
    }

    // Refresh bookings
    await fetchBookings();
  };

  const handleRefundSubmit = async (data: {
    sessionsToRefund?: number;
    refundAmount?: number;
    reason?: string;
  }) => {
    if (!selectedBooking) return;

    const response = await fetch(
      `/api/admin/block-bookings/${selectedBooking.id}/refund`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to process refund");
    }

    // Refresh bookings
    await fetchBookings();
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount / 100);
  };

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "exhausted", label: "All Used" },
    { value: "expired", label: "Expired" },
    { value: "refunded", label: "Refunded" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Block Bookings"
        subtitle={`${bookings.length} total packages`}
      >
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-navy hover:bg-navy/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Block Booking
        </Button>
      </AdminPageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard hover={false} className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Active
              </p>
              <p className="text-xl font-bold text-neutral-900">
                {stats.totalActive}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false} className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Remaining
              </p>
              <p className="text-xl font-bold text-neutral-900">
                {stats.remainingSessions}
                <span className="text-sm font-normal text-neutral-400 ml-1">
                  sessions
                </span>
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false} className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Expiring Soon
              </p>
              <p className="text-xl font-bold text-neutral-900">
                {stats.expiringSoon}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false} className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Revenue
              </p>
              <p className="text-xl font-bold text-neutral-900">
                {formatPrice(stats.revenue)}
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <AdminInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student or parent name..."
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                statusFilter === filter.value
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : error ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-[15px] font-semibold text-neutral-900 mb-2">
              Error Loading Bookings
            </h3>
            <p className="text-sm text-neutral-500 mb-4">{error}</p>
            <Button variant="adminSecondary" onClick={fetchBookings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </AdminCard>
      ) : filteredBookings.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title={
            searchQuery
              ? "No matching bookings"
              : statusFilter !== "all"
                ? `No ${BLOCK_BOOKING_STATUS_LABELS[statusFilter as BlockBookingStatus]?.toLowerCase()} bookings`
                : "No block bookings yet"
          }
          description={
            searchQuery
              ? "Try adjusting your search query"
              : "Create your first block booking to get started"
          }
          action={
            !searchQuery &&
            statusFilter === "all" && (
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-navy hover:bg-navy/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Block Booking
              </Button>
            )
          }
        />
      ) : (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredBookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <BlockBookingCard
                booking={booking}
                onDeduct={handleDeduct}
                onViewHistory={handleViewHistory}
                onRefund={handleRefund}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Dialogs */}
      <AddBlockBookingDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddSubmit}
      />

      <DeductSessionDialog
        isOpen={deductDialogOpen}
        onClose={() => {
          setDeductDialogOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onSubmit={handleDeductSubmit}
      />

      <UsageHistoryDialog
        isOpen={historyDialogOpen}
        onClose={() => {
          setHistoryDialogOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
      />

      <RefundDialog
        isOpen={refundDialogOpen}
        onClose={() => {
          setRefundDialogOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onSubmit={handleRefundSubmit}
      />
    </div>
  );
}
