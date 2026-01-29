"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import {
  RetentionMetrics,
  LostCustomerCard,
  AddFollowUpDialog,
  AddLostCustomerDialog,
  ScheduleCallDialog,
  MarkReturnedDialog,
} from "@/components/admin/retention";
import {
  UserMinus,
  Plus,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import {
  LostCustomerSummary,
  LostCustomerStatus,
  LostReason,
  RetentionMetrics as RetentionMetricsType,
  LOST_CUSTOMER_STATUS_LABELS,
  LOST_REASON_LABELS,
  PRIORITY_LABELS,
  CreateLostCustomerInput,
  AddFollowUpInput,
  ScheduleFollowUpInput,
  MarkAsReturnedInput,
} from "@/types/retention";
import { toast } from "@/components/ui/toast";

export default function RetentionPage() {
  const [customers, setCustomers] = useState<LostCustomerSummary[]>([]);
  const [metrics, setMetrics] = useState<RetentionMetricsType | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LostCustomerStatus | "all">("all");
  const [reasonFilter, setReasonFilter] = useState<LostReason | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<number | "all">("all");

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [returnedDialogOpen, setReturnedDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customersResponse, metricsResponse] = await Promise.all([
        fetch("/api/admin/retention"),
        fetch("/api/admin/retention/metrics"),
      ]);

      if (!customersResponse.ok) {
        throw new Error("Failed to fetch customers");
      }
      if (!metricsResponse.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const customersData = await customersResponse.json();
      const metricsData = await metricsResponse.json();

      if (customersData.success) {
        setCustomers(customersData.data.customers);
      } else {
        throw new Error(customersData.error || "Failed to fetch customers");
      }

      if (metricsData.success) {
        setMetrics(metricsData.data);
      } else {
        throw new Error(metricsData.error || "Failed to fetch metrics");
      }
    } catch (error) {
      console.error("Error fetching retention data:", error);
      toast("Failed to load retention data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          customer.studentName.toLowerCase().includes(query) ||
          customer.parentName.toLowerCase().includes(query) ||
          customer.parentEmail.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && customer.status !== statusFilter) {
        return false;
      }

      // Reason filter
      if (reasonFilter !== "all" && customer.lostReason !== reasonFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && customer.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [customers, searchQuery, statusFilter, reasonFilter, priorityFilter]);

  // Sort by priority then recency
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      // First by priority (1 = high comes first)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Then by days since lost (fewer = more recent = first)
      return a.daysSinceLost - b.daysSinceLost;
    });
  }, [filteredCustomers]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Dialog handlers
  const handleAddFollowUp = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setFollowUpDialogOpen(true);
  };

  const handleScheduleCall = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setScheduleDialogOpen(true);
  };

  const handleMarkReturned = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setReturnedDialogOpen(true);
  };

  // Submit handlers
  const handleAddCustomerSubmit = async (data: CreateLostCustomerInput) => {
    try {
      const response = await fetch("/api/admin/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add customer");
      }

      toast("Lost customer added successfully", "success");
      await fetchData();
    } catch (error) {
      console.error("Error adding customer:", error);
      toast(error instanceof Error ? error.message : "Failed to add customer", "error");
      throw error;
    }
  };

  const handleFollowUpSubmit = async (data: AddFollowUpInput) => {
    try {
      const response = await fetch(`/api/admin/retention/\${data.lostCustomerId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: data.method,
          notes: data.notes,
          outcome: data.outcome,
          nextFollowUpDate: data.nextFollowUpDate,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add follow-up");
      }

      toast("Follow-up recorded successfully", "success");
      await fetchData();
    } catch (error) {
      console.error("Error adding follow-up:", error);
      toast(error instanceof Error ? error.message : "Failed to add follow-up", "error");
      throw error;
    }
  };

  const handleScheduleSubmit = async (data: ScheduleFollowUpInput) => {
    try {
      const response = await fetch(`/api/admin/retention/\${data.lostCustomerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catchUpDate: data.followUpDate,
          nextStepNotes: data.notes,
          status: "follow_up_scheduled",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to schedule follow-up");
      }

      toast("Follow-up scheduled successfully", "success");
      await fetchData();
    } catch (error) {
      console.error("Error scheduling follow-up:", error);
      toast(error instanceof Error ? error.message : "Failed to schedule follow-up", "error");
      throw error;
    }
  };

  const handleReturnedSubmit = async (data: MarkAsReturnedInput) => {
    try {
      const response = await fetch(`/api/admin/retention/\${data.lostCustomerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "returned",
          returnedAt: new Date().toISOString(),
          returnBookingId: data.bookingId,
          returnNotes: data.notes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to mark as returned");
      }

      toast("Customer marked as returned!", "success");
      await fetchData();
    } catch (error) {
      console.error("Error marking as returned:", error);
      toast(error instanceof Error ? error.message : "Failed to mark as returned", "error");
      throw error;
    }
  };

  // Quick filter buttons for status
  const statusQuickFilters: (LostCustomerStatus | "all")[] = [
    "all",
    "lost",
    "follow_up_scheduled",
    "contacted",
    "returning",
    "returned",
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Retention" subtitle="Loading..." />
        <TableSkeleton rows={6} columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Retention"
        subtitle={`${customers.length} lost customers tracked`}
      >
        <Button
          variant="adminSecondary"
          onClick={fetchData}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button
          variant="adminPrimary"
          onClick={() => setAddDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Lost Customer
        </Button>
      </AdminPageHeader>

      {/* Metrics Dashboard */}
      {metrics && <RetentionMetrics metrics={metrics} />}

      {/* Filters Section */}
      <div className="space-y-4">
        {/* Search */}
        <AdminInput
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="max-w-md"
        />

        {/* Status Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {statusQuickFilters.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                statusFilter === status
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
              }`}
            >
              {status === "all" ? "All" : LOST_CUSTOMER_STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Filter className="h-4 w-4" />
            <span>Filters:</span>
          </div>
          <AdminSelect
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value as LostReason | "all")}
            className="w-44"
          >
            <option value="all">All Reasons</option>
            {(Object.keys(LOST_REASON_LABELS) as LostReason[]).map((reason) => (
              <option key={reason} value={reason}>
                {LOST_REASON_LABELS[reason]}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            value={priorityFilter === "all" ? "all" : priorityFilter.toString()}
            onChange={(e) =>
              setPriorityFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))
            }
            className="w-36"
          >
            <option value="all">All Priorities</option>
            {[1, 2, 3].map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </AdminSelect>
          {(statusFilter !== "all" || reasonFilter !== "all" || priorityFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setReasonFilter("all");
                setPriorityFilter("all");
                setSearchQuery("");
              }}
              className="text-sm text-sky-600 hover:text-sky-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-neutral-500">
        Showing {sortedCustomers.length} of {customers.length} customers
      </p>

      {/* Customer List */}
      {sortedCustomers.length === 0 ? (
        <AdminEmptyState
          icon={UserMinus}
          title="No lost customers found"
          description={
            searchQuery || statusFilter !== "all" || reasonFilter !== "all" || priorityFilter !== "all"
              ? "Try adjusting your filters to see more results"
              : "Add lost customers to start tracking retention"
          }
          action={
            !searchQuery && statusFilter === "all" && reasonFilter === "all" && priorityFilter === "all" && (
              <Button variant="adminPrimary" onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lost Customer
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedCustomers.map((customer) => (
            <LostCustomerCard
              key={customer.id}
              customer={customer}
              onAddFollowUp={handleAddFollowUp}
              onScheduleCall={handleScheduleCall}
              onMarkReturned={handleMarkReturned}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddLostCustomerDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddCustomerSubmit}
      />

      <AddFollowUpDialog
        isOpen={followUpDialogOpen}
        onClose={() => {
          setFollowUpDialogOpen(false);
          setSelectedCustomerId(null);
        }}
        onSubmit={handleFollowUpSubmit}
        customerId={selectedCustomerId || ""}
        customerName={selectedCustomer?.studentName}
      />

      <ScheduleCallDialog
        isOpen={scheduleDialogOpen}
        onClose={() => {
          setScheduleDialogOpen(false);
          setSelectedCustomerId(null);
        }}
        onSubmit={handleScheduleSubmit}
        customerId={selectedCustomerId || ""}
        customerName={selectedCustomer?.studentName}
        currentScheduledDate={selectedCustomer?.catchUpDate}
      />

      <MarkReturnedDialog
        isOpen={returnedDialogOpen}
        onClose={() => {
          setReturnedDialogOpen(false);
          setSelectedCustomerId(null);
        }}
        onSubmit={handleReturnedSubmit}
        customerId={selectedCustomerId || ""}
        customerName={selectedCustomer?.studentName}
      />
    </div>
  );
}
