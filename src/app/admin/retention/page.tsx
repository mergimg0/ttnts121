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
  daysSince,
  isFollowUpOverdue,
} from "@/types/retention";

// Mock data for development - will be replaced with API calls
const MOCK_CUSTOMERS: LostCustomerSummary[] = [
  {
    id: "1",
    studentName: "James Wilson",
    parentName: "Sarah Wilson",
    parentEmail: "sarah.wilson@email.com",
    status: "lost",
    lostReason: "schedule_conflict",
    lastSessionDate: "2024-12-15",
    daysSinceLost: 45,
    totalFollowUps: 0,
    priority: 1,
    nextStepNotes: "Was doing really well. Dad mentioned new after-school activities.",
  },
  {
    id: "2",
    studentName: "Emma Thompson",
    parentName: "David Thompson",
    parentEmail: "d.thompson@email.com",
    status: "follow_up_scheduled",
    lostReason: "cost",
    lastSessionDate: "2024-11-20",
    catchUpDate: "2025-02-01",
    daysSinceLost: 70,
    daysSinceContact: 14,
    totalFollowUps: 2,
    priority: 2,
  },
  {
    id: "3",
    studentName: "Oliver Brown",
    parentName: "Lisa Brown",
    parentEmail: "lisa.brown@email.com",
    status: "contacted",
    lostReason: "joined_team",
    lastSessionDate: "2024-10-01",
    daysSinceLost: 120,
    daysSinceContact: 3,
    totalFollowUps: 3,
    priority: 3,
    nextStepNotes: "Joined local team but might return for 1-2-1 skill work.",
  },
  {
    id: "4",
    studentName: "Sophie Davis",
    parentName: "Mark Davis",
    parentEmail: "markd@email.com",
    status: "returning",
    lastSessionDate: "2024-09-15",
    daysSinceLost: 136,
    daysSinceContact: 1,
    totalFollowUps: 4,
    priority: 2,
    nextStepNotes: "Booked to return next week! School holidays free.",
  },
  {
    id: "5",
    studentName: "Harry Miller",
    parentName: "Jane Miller",
    parentEmail: "jane.m@email.com",
    status: "returned",
    lostReason: "health_injury",
    lastSessionDate: "2024-08-01",
    daysSinceLost: 180,
    daysSinceContact: 30,
    totalFollowUps: 2,
    priority: 2,
  },
];

const MOCK_METRICS: RetentionMetricsType = {
  totalLost: 45,
  totalReturned: 12,
  totalDeclined: 5,
  totalPending: 28,
  returnRate: 27,
  byStatus: {
    lost: 15,
    follow_up_scheduled: 8,
    contacted: 5,
    returning: 5,
    returned: 12,
    declined: 5,
  },
  byReason: {
    schedule_conflict: 12,
    cost: 8,
    moved_away: 5,
    lost_interest: 4,
    joined_team: 6,
    school_commitments: 5,
    health_injury: 3,
    other: 2,
    unknown: 0,
  },
  lostThisMonth: 3,
  returnedThisMonth: 2,
  needsFollowUp: 7,
  averageDaysToReturn: 45,
  averageFollowUpsToReturn: 3,
};

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
      // TODO: Replace with actual API call
      // const response = await fetch("/api/admin/retention");
      // const data = await response.json();

      // Using mock data for now
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCustomers(MOCK_CUSTOMERS);
      setMetrics(MOCK_METRICS);
    } catch (error) {
      console.error("Error fetching retention data:", error);
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

  // Submit handlers (these will call APIs in production)
  const handleAddCustomerSubmit = async (data: CreateLostCustomerInput) => {
    console.log("Adding customer:", data);
    // TODO: API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    await fetchData();
  };

  const handleFollowUpSubmit = async (data: AddFollowUpInput) => {
    console.log("Adding follow-up:", data);
    // TODO: API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    await fetchData();
  };

  const handleScheduleSubmit = async (data: ScheduleFollowUpInput) => {
    console.log("Scheduling call:", data);
    // TODO: API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    await fetchData();
  };

  const handleReturnedSubmit = async (data: MarkAsReturnedInput) => {
    console.log("Marking as returned:", data);
    // TODO: API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    await fetchData();
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
