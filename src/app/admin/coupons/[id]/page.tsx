"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { ArrowLeft, Loader2, Tag, Trash2 } from "lucide-react";
import { Coupon } from "@/types/coupon";

export default function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minPurchase: "",
    maxUses: "",
    validFrom: "",
    validUntil: "",
    isActive: true,
  });

  useEffect(() => {
    fetchCoupon();
  }, [id]);

  const fetchCoupon = async () => {
    try {
      const response = await fetch(`/api/admin/coupons/${id}`);
      const data = await response.json();

      if (data.success && data.data) {
        const c = data.data as Coupon;
        setCoupon(c);

        // Parse dates
        const parseDate = (date: any): string => {
          if (!date) return "";
          const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
          return d.toISOString().slice(0, 16); // Format for datetime-local
        };

        setFormData({
          code: c.code,
          description: c.description || "",
          discountType: c.discountType,
          discountValue:
            c.discountType === "fixed"
              ? (c.discountValue / 100).toFixed(2) // Convert pence to pounds
              : c.discountValue.toString(),
          minPurchase: c.minPurchase ? (c.minPurchase / 100).toFixed(2) : "",
          maxUses: c.maxUses?.toString() || "",
          validFrom: parseDate(c.validFrom),
          validUntil: parseDate(c.validUntil),
          isActive: c.isActive,
        });
      } else {
        setError("Coupon not found");
      }
    } catch (err) {
      setError("Failed to load coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validate
      if (!formData.code.trim()) {
        throw new Error("Coupon code is required");
      }

      const discountValue = parseFloat(formData.discountValue);
      if (isNaN(discountValue) || discountValue <= 0) {
        throw new Error("Please enter a valid discount value");
      }

      if (formData.discountType === "percentage" && discountValue > 100) {
        throw new Error("Percentage discount cannot exceed 100%");
      }

      // Prepare data
      const data: Record<string, any> = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        discountType: formData.discountType,
        discountValue:
          formData.discountType === "fixed"
            ? Math.round(discountValue * 100)
            : discountValue,
        isActive: formData.isActive,
      };

      if (formData.minPurchase) {
        const minPurchase = parseFloat(formData.minPurchase);
        if (!isNaN(minPurchase) && minPurchase > 0) {
          data.minPurchase = Math.round(minPurchase * 100);
        }
      }

      if (formData.maxUses) {
        const maxUses = parseInt(formData.maxUses);
        if (!isNaN(maxUses) && maxUses > 0) {
          data.maxUses = maxUses;
        }
      }

      if (formData.validFrom) {
        data.validFrom = formData.validFrom;
      }

      if (formData.validUntil) {
        data.validUntil = formData.validUntil;
      }

      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/admin/coupons");
      } else {
        throw new Error(result.error || "Failed to update coupon");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this coupon? This cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/coupons/${id}?hard=true`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        router.push("/admin/coupons");
      } else {
        throw new Error(result.error || "Failed to delete coupon");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 mb-4">{error || "Coupon not found"}</p>
        <Link href="/admin/coupons">
          <Button variant="outline">Back to Coupons</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/coupons">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-900">
                Edit Coupon
              </h1>
              <AdminBadge variant={coupon.isActive ? "success" : "error"}>
                {coupon.isActive ? "Active" : "Inactive"}
              </AdminBadge>
            </div>
            <p className="text-[13px] text-neutral-500 mt-1">
              Used {coupon.usedCount} time{coupon.usedCount !== 1 ? "s" : ""}
              {coupon.maxUses ? ` of ${coupon.maxUses}` : ""}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <AdminCard hover={false}>
          <div className="space-y-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Coupon Code *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., SUMMER10"
                  className="pl-10 font-mono uppercase"
                  maxLength={20}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Internal note about this coupon..."
                rows={2}
              />
            </div>

            {/* Discount Type and Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Discount Type *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountType: e.target.value as "percentage" | "fixed",
                    })
                  }
                  className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (GBP)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Discount Value *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                    {formData.discountType === "percentage" ? "%" : "GBP"}
                  </span>
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: e.target.value })
                    }
                    placeholder={formData.discountType === "percentage" ? "10" : "5.00"}
                    className="pl-12"
                    min="0"
                    max={formData.discountType === "percentage" ? "100" : undefined}
                    step={formData.discountType === "percentage" ? "1" : "0.01"}
                  />
                </div>
              </div>
            </div>

            {/* Min Purchase */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Minimum Purchase (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                  GBP
                </span>
                <Input
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) =>
                    setFormData({ ...formData, minPurchase: e.target.value })
                  }
                  placeholder="0.00"
                  className="pl-12"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Max Uses */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Maximum Uses (optional)
              </label>
              <Input
                type="number"
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData({ ...formData, maxUses: e.target.value })
                }
                placeholder="Unlimited"
                min="1"
              />
            </div>

            {/* Validity Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Valid From (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, validFrom: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Valid Until (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-neutral-300"
              />
              <label htmlFor="isActive" className="text-sm text-neutral-700">
                Coupon is active and can be used
              </label>
            </div>
          </div>
        </AdminCard>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="bg-black hover:bg-neutral-800">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Link href="/admin/coupons">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
