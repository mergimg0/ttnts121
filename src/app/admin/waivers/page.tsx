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
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Edit,
  FileSignature,
} from "lucide-react";
import { WaiverTemplate } from "@/types/waiver";

export default function WaiversPage() {
  const [waivers, setWaivers] = useState<WaiverTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaivers();
  }, []);

  const fetchWaivers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/waivers");
      const data = await response.json();
      if (data.success) {
        setWaivers(data.data);
      }
    } catch (error) {
      console.error("Error fetching waivers:", error);
      toast("Failed to fetch waivers", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/waivers/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        if (data.deactivated) {
          toast("Waiver has signatures and was deactivated instead", "warning");
          // Update the local state to reflect deactivation
          setWaivers(
            waivers.map((w) => (w.id === id ? { ...w, isActive: false } : w))
          );
        } else {
          toast("Waiver deleted", "success");
          setWaivers(waivers.filter((w) => w.id !== id));
        }
      } else {
        toast(data.error || "Failed to delete waiver", "error");
      }
    } catch (error) {
      toast("Failed to delete waiver", "error");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/waivers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await response.json();
      if (data.success) {
        toast(
          `Waiver ${!currentActive ? "activated" : "deactivated"}`,
          "success"
        );
        setWaivers(
          waivers.map((w) =>
            w.id === id ? { ...w, isActive: !currentActive } : w
          )
        );
      } else {
        toast(data.error || "Failed to update waiver", "error");
      }
    } catch (error) {
      toast("Failed to update waiver", "error");
    }
  };

  const formatDate = (date: unknown) => {
    if (!date) return "-";
    const d =
      date && typeof date === "object" && "toDate" in date
        ? (date as { toDate: () => Date }).toDate()
        : new Date(date as string);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Desktop table content
  const tableContent = (
    <div className="overflow-x-auto">
      <table className="w-full">
        <AdminTableHead>
          <tr>
            <AdminTableHeader>Waiver</AdminTableHeader>
            <AdminTableHeader>Status</AdminTableHeader>
            <AdminTableHeader>Required</AdminTableHeader>
            <AdminTableHeader>Sessions</AdminTableHeader>
            <AdminTableHeader>Created</AdminTableHeader>
            <AdminTableHeader className="text-right">Actions</AdminTableHeader>
          </tr>
        </AdminTableHead>
        <AdminTableBody>
          {waivers.map((waiver) => (
            <AdminTableRow key={waiver.id}>
              <AdminTableCell>
                <Link
                  href={`/admin/waivers/${waiver.id}`}
                  className="hover:text-sky-600 transition-colors"
                >
                  <p className="font-medium text-neutral-900">{waiver.name}</p>
                  <p className="text-sm text-neutral-500 truncate max-w-xs">
                    {waiver.content.replace(/<[^>]*>/g, "").slice(0, 60)}...
                  </p>
                </Link>
              </AdminTableCell>
              <AdminTableCell>
                <AdminBadge variant={waiver.isActive ? "success" : "neutral"}>
                  {waiver.isActive ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </AdminBadge>
              </AdminTableCell>
              <AdminTableCell>
                <AdminBadge variant={waiver.isRequired ? "warning" : "neutral"}>
                  {waiver.isRequired ? "Required" : "Optional"}
                </AdminBadge>
              </AdminTableCell>
              <AdminTableCell className="text-sm text-neutral-600">
                {waiver.sessionIds && waiver.sessionIds.length > 0
                  ? `${waiver.sessionIds.length} session(s)`
                  : "All sessions"}
              </AdminTableCell>
              <AdminTableCell className="text-sm text-neutral-500">
                {formatDate(waiver.createdAt)}
              </AdminTableCell>
              <AdminTableCell className="text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="adminSecondary" size="sm" asChild>
                    <Link href={`/admin/waivers/${waiver.id}`}>
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleToggleActive(waiver.id, waiver.isActive)
                    }
                  >
                    {waiver.isActive ? (
                      <XCircle className="h-4 w-4 text-neutral-400 hover:text-amber-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-neutral-400 hover:text-green-500" />
                    )}
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-500" />
                      </Button>
                    }
                    title="Delete Waiver?"
                    description="This will delete this waiver template. If it has existing signatures, it will be deactivated instead. This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                    onConfirm={() => handleDelete(waiver.id)}
                  />
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTableBody>
      </table>
    </div>
  );

  // Mobile cards content
  const mobileContent = waivers.map((waiver) => (
    <MobileCard key={waiver.id}>
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/admin/waivers/${waiver.id}`}
          className="flex-1 min-w-0"
        >
          <p className="font-medium text-neutral-900 truncate">{waiver.name}</p>
          <p className="text-sm text-neutral-500 truncate">
            {waiver.content.replace(/<[^>]*>/g, "").slice(0, 40)}...
          </p>
        </Link>
        <AdminBadge variant={waiver.isActive ? "success" : "neutral"}>
          {waiver.isActive ? "Active" : "Inactive"}
        </AdminBadge>
      </div>
      <div className="pt-2 border-t border-neutral-100 space-y-1">
        <MobileCardRow label="Required">
          {waiver.isRequired ? "Yes" : "No"}
        </MobileCardRow>
        <MobileCardRow label="Sessions">
          {waiver.sessionIds && waiver.sessionIds.length > 0
            ? `${waiver.sessionIds.length} session(s)`
            : "All sessions"}
        </MobileCardRow>
        <MobileCardRow label="Created">
          {formatDate(waiver.createdAt)}
        </MobileCardRow>
      </div>
      <div className="pt-2 flex gap-2">
        <Button variant="adminSecondary" size="sm" className="flex-1" asChild>
          <Link href={`/admin/waivers/${waiver.id}`}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleActive(waiver.id, waiver.isActive)}
        >
          {waiver.isActive ? (
            <XCircle className="h-4 w-4 text-neutral-400" />
          ) : (
            <CheckCircle className="h-4 w-4 text-neutral-400" />
          )}
        </Button>
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 text-neutral-400" />
            </Button>
          }
          title="Delete Waiver?"
          description="This will delete this waiver template. If it has existing signatures, it will be deactivated instead."
          confirmText="Delete"
          variant="danger"
          onConfirm={() => handleDelete(waiver.id)}
        />
      </div>
    </MobileCard>
  ));

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Waivers"
        subtitle="Manage electronic waivers and agreements for bookings"
      >
        <Button variant="adminPrimary" asChild>
          <Link href="/admin/waivers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Waiver
          </Link>
        </Button>
      </AdminPageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
              <FileText className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {waivers.length}
              </p>
              <p className="text-xs text-neutral-500">Total Waivers</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {waivers.filter((w) => w.isActive).length}
              </p>
              <p className="text-xs text-neutral-500">Active Waivers</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <FileSignature className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {waivers.filter((w) => w.isRequired).length}
              </p>
              <p className="text-xs text-neutral-500">Required Waivers</p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Waivers List */}
      {loading ? (
        <AdminCard hover={false}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        </AdminCard>
      ) : waivers.length === 0 ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <div className="mx-auto h-14 w-14 rounded-full bg-neutral-50 flex items-center justify-center">
              <FileText className="h-7 w-7 text-neutral-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-neutral-900">
              No waivers
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Create your first waiver template for bookings
            </p>
            <Button variant="adminPrimary" className="mt-4" asChild>
              <Link href="/admin/waivers/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Waiver
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
