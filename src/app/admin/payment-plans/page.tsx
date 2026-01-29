"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import {
  Plus,
  Loader2,
  Calendar,
  Repeat,
  Pencil,
  Trash2,
  CreditCard,
} from "lucide-react";
import { PaymentPlan } from "@/types/payment-plan";
import { formatPrice } from "@/lib/booking-utils";

export default function PaymentPlansPage() {
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchPaymentPlans();
  }, [statusFilter]);

  const fetchPaymentPlans = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter === "active") {
        params.set("active", "true");
      }

      const response = await fetch(`/api/admin/payment-plans?${params}`);
      const data = await response.json();
      if (data.success) {
        let plans = data.data;
        // Filter inactive if needed
        if (statusFilter === "inactive") {
          plans = plans.filter((p: PaymentPlan) => !p.isActive);
        }
        setPaymentPlans(plans);
      }
    } catch (error) {
      console.error("Error fetching payment plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment plan?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/payment-plans/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        // Refresh the list
        fetchPaymentPlans();
      } else {
        alert(data.error || "Failed to delete payment plan");
      }
    } catch (error) {
      console.error("Error deleting payment plan:", error);
      alert("Failed to delete payment plan");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: unknown): string => {
    if (!date) return "-";
    const d = (date as { _seconds?: number })._seconds
      ? new Date((date as { _seconds: number })._seconds * 1000)
      : new Date(date as Date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Payment Plans"
        subtitle="Create installment payment options for customers"
      >
        <Link href="/admin/payment-plans/new">
          <Button variant="adminPrimary">
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </Link>
      </AdminPageHeader>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "active", "inactive"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 text-[13px] font-medium rounded-xl transition-all duration-200 ${
              statusFilter === status
                ? "bg-[#1e3a5f] text-white shadow-sm"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Payment Plans List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : paymentPlans.length === 0 ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-[15px] font-semibold text-neutral-900 mb-2">
              No payment plans yet
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              Create a payment plan to offer installment options to customers
            </p>
            <Link href="/admin/payment-plans/new">
              <Button variant="adminPrimary">
                <Plus className="h-4 w-4 mr-2" />
                Create Payment Plan
              </Button>
            </Link>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {paymentPlans.map((plan) => (
            <AdminCard key={plan.id} hover={false}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-medium text-neutral-900 truncate">
                      {plan.name}
                    </h3>
                    <AdminBadge variant={plan.isActive ? "success" : "warning"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </AdminBadge>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-neutral-500 truncate mb-2">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-[13px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Repeat className="h-3.5 w-3.5" />
                      {plan.installmentCount} payments
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Every {plan.intervalDays} days
                    </span>
                    {plan.minPurchaseAmount && (
                      <span>
                        Min: {formatPrice(plan.minPurchaseAmount)}
                      </span>
                    )}
                    <span>Created: {formatDate(plan.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/admin/payment-plans/${plan.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                    disabled={deletingId === plan.id}
                    className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingId === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
