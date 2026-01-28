"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { CartRecoveryMetricsCard } from "@/components/admin/cart-recovery-metrics";
import { ShoppingCart, Mail, Eye, RefreshCw, Loader2 } from "lucide-react";
import { AbandonedCart, CartRecoveryMetrics, AbandonedCartStatus } from "@/types/abandoned-cart";
import { formatPrice, toDate } from "@/lib/booking-utils";

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [metrics, setMetrics] = useState<CartRecoveryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AbandonedCartStatus | "all">("all");
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    fetchAbandonedCarts();
  }, []);

  const fetchAbandonedCarts = async () => {
    try {
      const response = await fetch("/api/admin/abandoned-carts?days=30");
      const data = await response.json();
      if (data.success) {
        setCarts(data.data.carts);
        setMetrics(data.data.metrics);
      }
    } catch (error) {
      console.error("Error fetching abandoned carts:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendRecoveryReminder = async (cartId: string) => {
    setSendingReminder(cartId);
    try {
      const response = await fetch(`/api/admin/abandoned-carts/${cartId}/send-reminder`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        // Refresh the list
        await fetchAbandonedCarts();
      } else {
        alert(data.error || "Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };

  const getCartStatus = (cart: AbandonedCart): { label: string; variant: "success" | "warning" | "error" | "neutral" | "info" } => {
    if (cart.recovered) {
      return { label: "Recovered", variant: "success" };
    }
    if (cart.recoveryEmailSent) {
      return { label: "Email Sent", variant: "info" };
    }
    const expiresAt = toDate(cart.expiresAt);
    if (expiresAt < new Date()) {
      return { label: "Expired", variant: "neutral" };
    }
    return { label: "Pending", variant: "warning" };
  };

  const filteredCarts = carts.filter((cart) => {
    if (filter === "all") return true;
    const status = getCartStatus(cart);
    if (filter === "pending") return status.label === "Pending";
    if (filter === "email_sent") return status.label === "Email Sent";
    if (filter === "recovered") return status.label === "Recovered";
    if (filter === "expired") return status.label === "Expired";
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Abandoned Carts"
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
        title="Abandoned Carts"
        subtitle={`${carts.length} carts in the last 30 days`}
      >
        <Button
          variant="adminSecondary"
          onClick={fetchAbandonedCarts}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </AdminPageHeader>

      {/* Metrics */}
      {metrics && <CartRecoveryMetricsCard metrics={metrics} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "email_sent", "recovered", "expired"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-[13px] font-medium rounded-xl transition-all duration-200 ${
              filter === status
                ? "bg-navy text-white shadow-sm"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
            }`}
          >
            {status === "all" ? "All" :
             status === "email_sent" ? "Email Sent" :
             status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Carts List */}
      {filteredCarts.length === 0 ? (
        <AdminEmptyState
          icon={ShoppingCart}
          title="No abandoned carts found"
          description={
            filter === "all"
              ? "Abandoned carts will appear here when customers leave items without completing checkout"
              : `No ${filter.replace("_", " ")} carts found`
          }
        />
      ) : (
        <ResponsiveTable
          mobileView={
            filteredCarts.map((cart) => {
              const status = getCartStatus(cart);
              return (
                <MobileCard key={cart.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {cart.customerName || cart.email.split("@")[0]}
                      </p>
                      <p className="text-[13px] text-neutral-500">{cart.email}</p>
                    </div>
                    <AdminBadge variant={status.variant}>
                      {status.label}
                    </AdminBadge>
                  </div>
                  <MobileCardRow label="Items">
                    <span className="text-sm text-neutral-600">{cart.items.length} session{cart.items.length !== 1 ? "s" : ""}</span>
                  </MobileCardRow>
                  <MobileCardRow label="Value">
                    <span className="text-sm font-semibold tabular-nums">{formatPrice(cart.totalAmount)}</span>
                  </MobileCardRow>
                  <MobileCardRow label="Created">
                    <span className="text-[13px] text-neutral-500">
                      {toDate(cart.createdAt).toLocaleDateString()}
                    </span>
                  </MobileCardRow>
                  {!cart.recovered && !cart.recoveryEmailSent && toDate(cart.expiresAt) > new Date() && (
                    <div className="pt-3 border-t border-neutral-100">
                      <Button
                        variant="adminSecondary"
                        size="sm"
                        onClick={() => sendRecoveryReminder(cart.id)}
                        disabled={sendingReminder === cart.id}
                        className="w-full"
                      >
                        {sendingReminder === cart.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Reminder
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </MobileCard>
              );
            })
          }
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredCarts.map((cart) => {
                const status = getCartStatus(cart);
                return (
                  <tr key={cart.id} className="group hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {cart.customerName || cart.email.split("@")[0]}
                        </p>
                        <p className="text-[13px] text-neutral-500">
                          {cart.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-neutral-900">
                          {cart.items.length} session{cart.items.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-[13px] text-neutral-500 truncate max-w-[200px]">
                          {cart.items.map((i) => i.sessionName).join(", ")}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold tabular-nums text-neutral-900">
                        {formatPrice(cart.totalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <AdminBadge variant={status.variant}>
                        {status.label}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-neutral-500">
                      {toDate(cart.createdAt).toLocaleDateString()}
                      <br />
                      <span className="text-neutral-400">
                        {toDate(cart.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {!cart.recovered && !cart.recoveryEmailSent && toDate(cart.expiresAt) > new Date() && (
                        <Button
                          variant="adminSecondary"
                          size="sm"
                          onClick={() => sendRecoveryReminder(cart.id)}
                          disabled={sendingReminder === cart.id}
                        >
                          {sendingReminder === cart.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Reminder
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
