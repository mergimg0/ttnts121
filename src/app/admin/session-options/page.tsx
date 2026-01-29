"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/ui/admin-table";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { Edit, Trash2, Plus, Loader2, Package } from "lucide-react";
import { SessionOption } from "@/types/session-option";
import { formatPrice } from "@/lib/booking-utils";

export default function SessionOptionsPage() {
  const [options, setOptions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const response = await fetch("/api/admin/session-options");
      const data = await response.json();

      if (data.success) {
        setOptions(data.data);
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this option?")) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/session-options/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setOptions(options.filter((o) => o.id !== id));
      } else {
        alert(data.error || "Failed to delete option");
      }
    } catch (error) {
      console.error("Error deleting option:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Session Options" subtitle="Loading..." />
        <TableSkeleton rows={6} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminPageHeader
          title="Session Options"
          subtitle="Manage add-ons and extras for sessions"
        />
        <Link href="/admin/session-options/new">
          <Button variant="adminPrimary">
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </Link>
      </div>

      {/* Options List */}
      {options.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title="No session options yet"
          description="Create add-ons like equipment hire, meal packages, or extra coaching"
          action={
            <Button variant="adminPrimary" asChild>
              <Link href="/admin/session-options/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Option
              </Link>
            </Button>
          }
        />
      ) : (
        <ResponsiveTable
          mobileView={options.map((option) => (
            <MobileCard key={option.id}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-neutral-900">{option.name}</p>
                  {option.description && (
                    <p className="text-[12px] text-neutral-500 mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {option.isRequired && (
                    <AdminBadge variant="warning">Required</AdminBadge>
                  )}
                  <AdminBadge variant={option.isActive ? "success" : "error"}>
                    {option.isActive ? "Active" : "Inactive"}
                  </AdminBadge>
                </div>
              </div>
              <MobileCardRow label="Price">
                <span className="font-semibold">{formatPrice(option.price)}</span>
              </MobileCardRow>
              <MobileCardRow label="Max Qty">
                {option.maxQuantity || 1}
              </MobileCardRow>
              <MobileCardRow label="Applies To">
                {option.sessionIds && option.sessionIds.length > 0
                  ? `${option.sessionIds.length} session(s)`
                  : "All sessions"}
              </MobileCardRow>
              <div className="pt-2 border-t border-neutral-100 flex gap-2">
                <Button
                  variant="adminSecondary"
                  size="sm"
                  asChild
                  className="flex-1 h-8"
                >
                  <Link href={`/admin/session-options/${option.id}`}>
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Link>
                </Button>
                <button
                  onClick={() => handleDelete(option.id)}
                  disabled={deleting === option.id}
                  className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting === option.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </MobileCard>
          ))}
        >
          <AdminTable>
            <AdminTableHead>
              <tr>
                <AdminTableHeader>Option</AdminTableHeader>
                <AdminTableHeader>Price</AdminTableHeader>
                <AdminTableHeader>Max Qty</AdminTableHeader>
                <AdminTableHeader>Applies To</AdminTableHeader>
                <AdminTableHeader>Status</AdminTableHeader>
                <AdminTableHeader className="text-right">Actions</AdminTableHeader>
              </tr>
            </AdminTableHead>
            <AdminTableBody>
              {options.map((option) => (
                <AdminTableRow key={option.id}>
                  <AdminTableCell>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {option.name}
                      </p>
                      {option.description && (
                        <p className="text-[13px] text-neutral-500">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="text-sm font-semibold tabular-nums text-neutral-900">
                      {formatPrice(option.price)}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="text-sm text-neutral-600">
                      {option.maxQuantity || 1}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="text-sm text-neutral-600">
                      {option.sessionIds && option.sessionIds.length > 0
                        ? `${option.sessionIds.length} session(s)`
                        : "All sessions"}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex gap-1">
                      {option.isRequired && (
                        <AdminBadge variant="warning">Required</AdminBadge>
                      )}
                      <AdminBadge variant={option.isActive ? "success" : "error"}>
                        {option.isActive ? "Active" : "Inactive"}
                      </AdminBadge>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/session-options/${option.id}`}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(option.id)}
                        disabled={deleting === option.id}
                        className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting === option.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </ResponsiveTable>
      )}
    </div>
  );
}
