"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import {
  Plus,
  Loader2,
  Tag,
  Percent,
  DollarSign,
  Copy,
  CheckCircle,
  Trash2,
  Pencil,
} from "lucide-react";
import { Coupon } from "@/types/coupon";
import { formatPrice } from "@/lib/booking-utils";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchCoupons();
  }, [statusFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      params.set("limit", "100");

      const response = await fetch(`/api/admin/coupons?${params}`);
      const data = await response.json();
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this coupon?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setCoupons((items) =>
          items.map((item) =>
            item.id === id ? { ...item, isActive: false } : item
          )
        );
      } else {
        alert(data.error || "Failed to deactivate coupon");
      }
    } catch (error) {
      console.error("Error deactivating coupon:", error);
      alert("Failed to deactivate coupon");
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

  const isExpired = (coupon: Coupon) => {
    if (!coupon.validUntil) return false;
    const expiry = coupon.validUntil as { _seconds?: number };
    const validUntil = expiry._seconds
      ? new Date(expiry._seconds * 1000)
      : new Date(coupon.validUntil as Date);
    return validUntil < new Date();
  };

  const isMaxedOut = (coupon: Coupon) => {
    return coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses;
  };

  const getStatus = (coupon: Coupon) => {
    if (!coupon.isActive) return "inactive";
    if (isExpired(coupon)) return "expired";
    if (isMaxedOut(coupon)) return "maxed";
    return "active";
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "expired":
        return "warning";
      case "maxed":
        return "warning";
      default:
        return "info";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "expired":
        return "Expired";
      case "maxed":
        return "Limit Reached";
      default:
        return status;
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    }
    return formatPrice(coupon.discountValue);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Coupons</h1>
          <p className="text-[13px] text-neutral-500 mt-1">
            Create and manage discount codes
          </p>
        </div>
        <Link href="/admin/coupons/new">
          <Button className="bg-black hover:bg-neutral-800">
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "active", "inactive", "expired"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              statusFilter === status
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : coupons.length === 0 ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <Tag className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-[15px] font-semibold text-neutral-900 mb-2">
              No coupons yet
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              Create a discount code to offer special pricing
            </p>
            <Link href="/admin/coupons/new">
              <Button className="bg-black hover:bg-neutral-800">
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </Link>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const status = getStatus(coupon);

            return (
              <AdminCard key={coupon.id} hover={false}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-[15px] font-mono font-semibold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                        {coupon.code}
                      </code>
                      <AdminBadge variant={getStatusVariant(status)}>
                        {getStatusLabel(status)}
                      </AdminBadge>
                    </div>
                    {coupon.description && (
                      <p className="text-sm text-neutral-500 truncate mb-1">
                        {coupon.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-[13px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        {coupon.discountType === "percentage" ? (
                          <Percent className="h-3 w-3" />
                        ) : (
                          <DollarSign className="h-3 w-3" />
                        )}
                        {formatDiscount(coupon)} off
                      </span>
                      <span>
                        Used: {coupon.usedCount}
                        {coupon.maxUses ? `/${coupon.maxUses}` : ""}
                      </span>
                      {coupon.validUntil && (
                        <span>Expires: {formatDate(coupon.validUntil)}</span>
                      )}
                      {coupon.minPurchase && (
                        <span>Min: {formatPrice(coupon.minPurchase)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(coupon.code, coupon.id)}
                      className="h-9 px-3"
                    >
                      {copiedId === coupon.id ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/admin/coupons/${coupon.id}`}>
                      <Button variant="outline" size="sm" className="h-9 px-3">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    {coupon.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(coupon.id)}
                        disabled={deletingId === coupon.id}
                        className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingId === coupon.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
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
