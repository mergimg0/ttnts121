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
  Link2,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { PaymentLink } from "@/types/payment";
import { formatPrice } from "@/lib/booking-utils";

export default function PaymentLinksPage() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchPaymentLinks();
  }, [statusFilter]);

  const fetchPaymentLinks = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      params.set("limit", "100");

      const response = await fetch(`/api/admin/payment-links?${params}`);
      const data = await response.json();
      if (data.success) {
        setPaymentLinks(data.data);
      }
    } catch (error) {
      console.error("Error fetching payment links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this payment link?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/payment-links/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setPaymentLinks((links) =>
          links.map((link) =>
            link.id === id ? { ...link, status: "cancelled" as const } : link
          )
        );
      } else {
        alert(data.error || "Failed to deactivate payment link");
      }
    } catch (error) {
      console.error("Error deactivating payment link:", error);
      alert("Failed to deactivate payment link");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: any): string => {
    if (!date) return "-";
    const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "info";
      case "expired":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "info";
    }
  };

  const isExpired = (link: PaymentLink) => {
    if (!link.expiresAt) return false;
    const expiry = link.expiresAt as { _seconds?: number };
    const expiresAt = expiry._seconds
      ? new Date(expiry._seconds * 1000)
      : new Date(link.expiresAt as Date);
    return expiresAt < new Date();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Payment Links"
        subtitle="Create and manage custom payment links"
      >
        <Link href="/admin/payment-links/new">
          <Button variant="adminPrimary">
            <Plus className="h-4 w-4 mr-2" />
            Create Link
          </Button>
        </Link>
      </AdminPageHeader>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "active", "completed", "expired", "cancelled"].map((status) => (
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

      {/* Payment Links List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : paymentLinks.length === 0 ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <Link2 className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-[15px] font-semibold text-neutral-900 mb-2">
              No payment links yet
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              Create a custom payment link for one-off payments
            </p>
            <Link href="/admin/payment-links/new">
              <Button variant="adminPrimary">
                <Plus className="h-4 w-4 mr-2" />
                Create Payment Link
              </Button>
            </Link>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {paymentLinks.map((link) => {
            const expired = isExpired(link);
            const displayStatus = expired && link.status === "active" ? "expired" : link.status;

            return (
              <AdminCard key={link.id} hover={false}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-medium text-neutral-900 truncate">
                        {link.description}
                      </h3>
                      <AdminBadge variant={getStatusVariant(displayStatus)}>
                        {displayStatus}
                      </AdminBadge>
                    </div>
                    <p className="text-sm text-neutral-500 truncate">
                      {link.customerEmail}
                      {link.customerName && ` (${link.customerName})`}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[13px] text-neutral-400">
                      <span>Created: {formatDate(link.createdAt)}</span>
                      {link.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires: {formatDate(link.expiresAt)}
                        </span>
                      )}
                      {link.paidAt && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Paid: {formatDate(link.paidAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold tabular-nums text-neutral-900">
                      {formatPrice(link.amount)}
                    </p>

                    <div className="flex items-center gap-2">
                      {link.status === "active" && !expired && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(link.stripePaymentLinkUrl, link.id)}
                            className="h-9 px-3"
                          >
                            {copiedId === link.id ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(link.stripePaymentLinkUrl, "_blank")}
                            className="h-9 px-3"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivate(link.id)}
                            disabled={deletingId === link.id}
                            className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingId === link.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
