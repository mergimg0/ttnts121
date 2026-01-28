"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import {
  AdminTableHead,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/ui/admin-table";
import {
  ResponsiveTable,
  MobileCard,
  MobileCardRow,
} from "@/components/admin/mobile-table";
import { toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import {
  Loader2,
  Plus,
  Percent,
  Users,
  ShoppingBag,
  Clock,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { DiscountRule } from "@/types/discount-rule";
import { formatDiscountDescription } from "@/lib/discount-utils";

const typeConfig = {
  sibling: { label: "Sibling", variant: "info" as const, icon: Users },
  bulk: { label: "Bulk", variant: "success" as const, icon: ShoppingBag },
  early_bird: { label: "Early Bird", variant: "warning" as const, icon: Clock },
};

export default function DiscountsPage() {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/discounts");
      const data = await response.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch (error) {
      console.error("Error fetching discount rules:", error);
      toast("Failed to fetch discount rules", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (rule: DiscountRule) => {
    try {
      const response = await fetch(`/api/admin/discounts/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const data = await response.json();
      if (data.success) {
        toast(
          `Discount ${rule.isActive ? "disabled" : "enabled"}`,
          "success"
        );
        setRules(
          rules.map((r) =>
            r.id === rule.id ? { ...r, isActive: !r.isActive } : r
          )
        );
      } else {
        toast(data.error || "Failed to update discount", "error");
      }
    } catch (error) {
      toast("Failed to update discount", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast("Discount deleted", "success");
        setRules(rules.filter((r) => r.id !== id));
      } else {
        toast(data.error || "Failed to delete discount", "error");
      }
    } catch (error) {
      toast("Failed to delete discount", "error");
    }
  };

  const formatDiscount = (rule: DiscountRule) => {
    if (rule.discount.type === "percentage") {
      return `${rule.discount.value}%`;
    }
    return `${(rule.discount.value / 100).toFixed(2)}`;
  };

  // Desktop table content
  const tableContent = (
    <div className="overflow-x-auto">
      <table className="w-full">
        <AdminTableHead>
          <tr>
            <AdminTableHeader>Name</AdminTableHeader>
            <AdminTableHeader>Type</AdminTableHeader>
            <AdminTableHeader>Discount</AdminTableHeader>
            <AdminTableHeader>Status</AdminTableHeader>
            <AdminTableHeader>Priority</AdminTableHeader>
            <AdminTableHeader className="text-right">Actions</AdminTableHeader>
          </tr>
        </AdminTableHead>
        <AdminTableBody>
          {rules.map((rule) => {
            const config = typeConfig[rule.type];
            const TypeIcon = config.icon;
            return (
              <AdminTableRow key={rule.id}>
                <AdminTableCell>
                  <Link
                    href={`/admin/discounts/${rule.id}`}
                    className="hover:text-sky-600 transition-colors"
                  >
                    <p className="font-medium text-neutral-900">{rule.name}</p>
                    <p className="text-sm text-neutral-500 truncate max-w-xs">
                      {formatDiscountDescription(rule)}
                    </p>
                  </Link>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge variant={config.variant}>
                    <TypeIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </AdminBadge>
                </AdminTableCell>
                <AdminTableCell className="font-medium tabular-nums">
                  {formatDiscount(rule)}
                  {rule.discount.appliesTo === "additional" && (
                    <span className="text-xs text-neutral-500 ml-1">
                      (additional only)
                    </span>
                  )}
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge variant={rule.isActive ? "success" : "neutral"}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </AdminBadge>
                </AdminTableCell>
                <AdminTableCell className="text-sm text-neutral-600 tabular-nums">
                  {rule.priority}
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(rule)}
                      title={rule.isActive ? "Disable" : "Enable"}
                    >
                      {rule.isActive ? (
                        <ToggleRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-neutral-400" />
                      )}
                    </Button>
                    <Button variant="adminSecondary" size="sm" asChild>
                      <Link href={`/admin/discounts/${rule.id}`}>
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-500" />
                        </Button>
                      }
                      title="Delete Discount Rule?"
                      description="This will permanently delete this discount rule. Existing bookings will not be affected."
                      confirmText="Delete"
                      variant="danger"
                      onConfirm={() => handleDelete(rule.id)}
                    />
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            );
          })}
        </AdminTableBody>
      </table>
    </div>
  );

  // Mobile cards content
  const mobileContent = rules.map((rule) => {
    const config = typeConfig[rule.type];
    const TypeIcon = config.icon;
    return (
      <MobileCard key={rule.id}>
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/admin/discounts/${rule.id}`}
            className="flex-1 min-w-0"
          >
            <p className="font-medium text-neutral-900 truncate">{rule.name}</p>
            <p className="text-sm text-neutral-500 truncate">
              {formatDiscountDescription(rule)}
            </p>
          </Link>
          <AdminBadge variant={rule.isActive ? "success" : "neutral"}>
            {rule.isActive ? "Active" : "Inactive"}
          </AdminBadge>
        </div>
        <div className="pt-2 border-t border-neutral-100 space-y-1">
          <MobileCardRow label="Type">
            <AdminBadge variant={config.variant}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {config.label}
            </AdminBadge>
          </MobileCardRow>
          <MobileCardRow label="Discount">{formatDiscount(rule)}</MobileCardRow>
          <MobileCardRow label="Priority">{rule.priority}</MobileCardRow>
        </div>
        <div className="pt-2 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggle(rule)}
            className="flex-none"
          >
            {rule.isActive ? (
              <ToggleRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-neutral-400" />
            )}
          </Button>
          <Button variant="adminSecondary" size="sm" className="flex-1" asChild>
            <Link href={`/admin/discounts/${rule.id}`}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Link>
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 text-neutral-400" />
              </Button>
            }
            title="Delete Discount Rule?"
            description="This will permanently delete this discount rule."
            confirmText="Delete"
            variant="danger"
            onConfirm={() => handleDelete(rule.id)}
          />
        </div>
      </MobileCard>
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Discounts"
        subtitle="Manage sibling, bulk, and early bird discount rules"
      >
        <Button variant="adminPrimary" asChild>
          <Link href="/admin/discounts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Discount
          </Link>
        </Button>
      </AdminPageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
              <Percent className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {rules.length}
              </p>
              <p className="text-xs text-neutral-500">Total Rules</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <ToggleRight className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {rules.filter((r) => r.isActive).length}
              </p>
              <p className="text-xs text-neutral-500">Active Rules</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {rules.filter((r) => r.type === "sibling").length}
              </p>
              <p className="text-xs text-neutral-500">Sibling Discounts</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {rules.filter((r) => r.type === "early_bird").length}
              </p>
              <p className="text-xs text-neutral-500">Early Bird</p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Rules List */}
      {loading ? (
        <AdminCard hover={false}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        </AdminCard>
      ) : rules.length === 0 ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <div className="mx-auto h-14 w-14 rounded-full bg-neutral-50 flex items-center justify-center">
              <Percent className="h-7 w-7 text-neutral-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-neutral-900">
              No discount rules
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Create a discount rule to offer sibling, bulk, or early bird
              discounts
            </p>
            <Button variant="adminPrimary" className="mt-4" asChild>
              <Link href="/admin/discounts/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Discount
              </Link>
            </Button>
          </div>
        </AdminCard>
      ) : (
        <ResponsiveTable mobileView={mobileContent}>
          {tableContent}
        </ResponsiveTable>
      )}
    </div>
  );
}
