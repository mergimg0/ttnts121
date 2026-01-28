"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import {
  ArrowLeft,
  Loader2,
  Percent,
  Users,
  ShoppingBag,
  Clock,
  Trash2,
} from "lucide-react";
import { DiscountRule, UpdateDiscountRuleInput } from "@/types/discount-rule";

export default function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rule, setRule] = useState<DiscountRule | null>(null);

  const [formData, setFormData] = useState<UpdateDiscountRuleInput>({
    name: "",
    description: "",
    type: "sibling",
    conditions: {},
    discount: {
      type: "percentage",
      value: 10,
      appliesTo: "additional",
    },
    isActive: true,
    priority: 0,
  });

  useEffect(() => {
    fetchRule();
  }, [id]);

  const fetchRule = async () => {
    try {
      const response = await fetch(`/api/admin/discounts/${id}`);
      const data = await response.json();

      if (data.success) {
        setRule(data.data);
        setFormData({
          name: data.data.name,
          description: data.data.description || "",
          type: data.data.type,
          conditions: data.data.conditions || {},
          discount: data.data.discount,
          isActive: data.data.isActive,
          priority: data.data.priority || 0,
        });
      } else {
        toast("Discount rule not found", "error");
        router.push("/admin/discounts");
      }
    } catch (error) {
      console.error("Error fetching discount rule:", error);
      toast("Failed to load discount rule", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: "sibling" | "bulk" | "early_bird") => {
    const newConditions =
      type === "sibling"
        ? { minChildren: formData.conditions?.minChildren || 2 }
        : type === "bulk"
          ? { minQuantity: formData.conditions?.minQuantity || 3 }
          : { daysBeforeSession: formData.conditions?.daysBeforeSession || 14 };

    setFormData({
      ...formData,
      type,
      conditions: newConditions,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validation
    if (!formData.name?.trim()) {
      setError("Name is required");
      setSaving(false);
      return;
    }

    if (formData.discount && formData.discount.value <= 0) {
      setError("Discount value must be greater than 0");
      setSaving(false);
      return;
    }

    if (
      formData.discount?.type === "percentage" &&
      formData.discount.value > 100
    ) {
      setError("Percentage discount cannot exceed 100%");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast("Discount rule updated successfully", "success");
        router.push("/admin/discounts");
      } else {
        setError(data.error || "Failed to update discount rule");
        toast(data.error || "Failed to update discount rule", "error");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast("Discount rule deleted", "success");
        router.push("/admin/discounts");
      } else {
        toast(data.error || "Failed to delete discount rule", "error");
      }
    } catch (error) {
      toast("Failed to delete discount rule", "error");
    }
  };

  const getPreviewText = () => {
    const { type, conditions, discount } = formData;
    if (!discount) return "";

    const discountText =
      discount.type === "percentage"
        ? `${discount.value}% off`
        : `${(discount.value / 100).toFixed(2)} off`;

    const appliesText =
      discount.appliesTo === "additional"
        ? "additional bookings"
        : "all bookings";

    switch (type) {
      case "sibling":
        return `${discountText} ${appliesText} when booking for ${conditions?.minChildren || 2}+ children`;
      case "bulk":
        return `${discountText} ${appliesText} when booking ${conditions?.minQuantity || 3}+ sessions`;
      case "early_bird":
        return `${discountText} when booking ${conditions?.daysBeforeSession || 14}+ days in advance`;
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/discounts"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Edit Discount
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Update discount rule settings
            </p>
          </div>
        </div>
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
              Delete
            </Button>
          }
          title="Delete Discount Rule?"
          description="This will permanently delete this discount rule. Existing bookings will not be affected."
          confirmText="Delete"
          variant="danger"
          onConfirm={handleDelete}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Basic Information
            </h2>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <AdminInput
                label="Name *"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., Sibling Discount 10%"
              />

              <AdminInput
                label="Description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description for internal reference"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminInput
                  label="Priority"
                  type="number"
                  value={formData.priority || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  hint="Higher priority rules are applied first"
                />

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Status
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, isActive: true })
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        formData.isActive
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-neutral-100 text-neutral-600 border border-transparent hover:bg-neutral-200"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, isActive: false })
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        !formData.isActive
                          ? "bg-neutral-200 text-neutral-700 border border-neutral-300"
                          : "bg-neutral-100 text-neutral-600 border border-transparent hover:bg-neutral-200"
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </AdminCard>

          {/* Discount Type */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Discount Type
            </h2>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleTypeChange("sibling")}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  formData.type === "sibling"
                    ? "border-sky-500 bg-sky-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <Users
                  className={`h-6 w-6 mb-2 ${formData.type === "sibling" ? "text-sky-600" : "text-neutral-400"}`}
                />
                <p className="font-medium text-neutral-900">Sibling</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Discount for multiple children
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("bulk")}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  formData.type === "bulk"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <ShoppingBag
                  className={`h-6 w-6 mb-2 ${formData.type === "bulk" ? "text-emerald-600" : "text-neutral-400"}`}
                />
                <p className="font-medium text-neutral-900">Bulk</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Discount for multiple sessions
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("early_bird")}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  formData.type === "early_bird"
                    ? "border-amber-500 bg-amber-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <Clock
                  className={`h-6 w-6 mb-2 ${formData.type === "early_bird" ? "text-amber-600" : "text-neutral-400"}`}
                />
                <p className="font-medium text-neutral-900">Early Bird</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Discount for early bookings
                </p>
              </button>
            </div>
          </AdminCard>

          {/* Conditions */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Conditions
            </h2>

            <div className="space-y-4">
              {formData.type === "sibling" && (
                <AdminInput
                  label="Minimum Children *"
                  type="number"
                  min={2}
                  value={formData.conditions?.minChildren || 2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        minChildren: parseInt(e.target.value) || 2,
                      },
                    })
                  }
                  hint="Discount applies when booking for this many or more children"
                />
              )}

              {formData.type === "bulk" && (
                <AdminInput
                  label="Minimum Sessions *"
                  type="number"
                  min={2}
                  value={formData.conditions?.minQuantity || 3}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        minQuantity: parseInt(e.target.value) || 3,
                      },
                    })
                  }
                  hint="Discount applies when booking this many or more sessions"
                />
              )}

              {formData.type === "early_bird" && (
                <AdminInput
                  label="Days Before Session *"
                  type="number"
                  min={1}
                  value={formData.conditions?.daysBeforeSession || 14}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        daysBeforeSession: parseInt(e.target.value) || 14,
                      },
                    })
                  }
                  hint="Discount applies when booking this many days before session starts"
                />
              )}
            </div>
          </AdminCard>

          {/* Discount Amount */}
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Discount Amount
            </h2>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminSelect
                  label="Discount Type"
                  value={formData.discount?.type || "percentage"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: {
                        ...formData.discount!,
                        type: e.target.value as "percentage" | "fixed",
                      },
                    })
                  }
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (pence)</option>
                </AdminSelect>

                <AdminInput
                  label={
                    formData.discount?.type === "percentage"
                      ? "Percentage *"
                      : "Amount (pence) *"
                  }
                  type="number"
                  min={1}
                  max={
                    formData.discount?.type === "percentage" ? 100 : undefined
                  }
                  value={formData.discount?.value || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: {
                        ...formData.discount!,
                        value: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  hint={
                    formData.discount?.type === "percentage"
                      ? "Enter value between 1-100"
                      : "Enter amount in pence (e.g., 500 = 5.00)"
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Applies To
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        discount: {
                          ...formData.discount!,
                          appliesTo: "additional",
                        },
                      })
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      formData.discount?.appliesTo === "additional"
                        ? "bg-sky-100 text-sky-700 border border-sky-200"
                        : "bg-neutral-100 text-neutral-600 border border-transparent hover:bg-neutral-200"
                    }`}
                  >
                    Additional Only
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        discount: { ...formData.discount!, appliesTo: "all" },
                      })
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      formData.discount?.appliesTo === "all"
                        ? "bg-sky-100 text-sky-700 border border-sky-200"
                        : "bg-neutral-100 text-neutral-600 border border-transparent hover:bg-neutral-200"
                    }`}
                  >
                    All Items
                  </button>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  {formData.discount?.appliesTo === "additional"
                    ? "Discount applies only to 2nd, 3rd, etc. bookings (1st pays full price)"
                    : "Discount applies to all items in the cart"}
                </p>
              </div>
            </div>
          </AdminCard>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" variant="adminPrimary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button type="button" variant="adminSecondary" asChild>
              <Link href="/admin/discounts">Cancel</Link>
            </Button>
          </div>
        </form>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          <AdminCard hover={false}>
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Preview
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                <Percent className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">
                  {formData.name || "Discount Name"}
                </p>
                <p className="text-xs text-neutral-500">
                  {formData.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 text-sm text-neutral-700">
              {getPreviewText()}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
