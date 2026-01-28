"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import {
  AdminTable,
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
  Trash2,
  Edit,
  Copy,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { FormTemplateWithStats } from "@/types/form";

export default function FormsPage() {
  const [forms, setForms] = useState<FormTemplateWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/forms");
      const data = await response.json();
      if (data.success) {
        setForms(data.data);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast("Failed to fetch forms", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/forms/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        if (data.deactivated) {
          toast("Form deactivated (has responses)", "success");
          fetchForms();
        } else {
          toast("Form deleted", "success");
          setForms(forms.filter((f) => f.id !== id));
        }
      } else {
        toast(data.error || "Failed to delete form", "error");
      }
    } catch (error) {
      toast("Failed to delete form", "error");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/forms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await response.json();
      if (data.success) {
        toast(
          `Form ${!isActive ? "activated" : "deactivated"}`,
          "success"
        );
        setForms(
          forms.map((f) =>
            f.id === id ? { ...f, isActive: !isActive } : f
          )
        );
      } else {
        toast(data.error || "Failed to update form", "error");
      }
    } catch (error) {
      toast("Failed to update form", "error");
    }
  };

  const formatDate = (date: unknown) => {
    if (!date) return "-";
    const d =
      typeof date === "object" && "toDate" in date
        ? (date as { toDate: () => Date }).toDate()
        : new Date(date as string);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Stats
  const totalForms = forms.length;
  const activeForms = forms.filter((f) => f.isActive).length;
  const totalResponses = forms.reduce((acc, f) => acc + (f.responseCount || 0), 0);

  // Desktop table content
  const tableContent = (
    <div className="overflow-x-auto">
      <table className="w-full">
        <AdminTableHead>
          <tr>
            <AdminTableHeader>Form Name</AdminTableHeader>
            <AdminTableHeader>Questions</AdminTableHeader>
            <AdminTableHeader>Responses</AdminTableHeader>
            <AdminTableHeader>Status</AdminTableHeader>
            <AdminTableHeader>Created</AdminTableHeader>
            <AdminTableHeader className="text-right">Actions</AdminTableHeader>
          </tr>
        </AdminTableHead>
        <AdminTableBody>
          {forms.map((form) => (
            <AdminTableRow key={form.id}>
              <AdminTableCell>
                <Link
                  href={`/admin/forms/${form.id}`}
                  className="hover:text-sky-600 transition-colors"
                >
                  <p className="font-medium text-neutral-900">{form.name}</p>
                  {form.description && (
                    <p className="text-xs text-neutral-500 truncate max-w-xs">
                      {form.description}
                    </p>
                  )}
                </Link>
              </AdminTableCell>
              <AdminTableCell>
                <span className="text-neutral-600">
                  {form.questions?.length || 0}
                </span>
              </AdminTableCell>
              <AdminTableCell>
                <span className="text-neutral-600">
                  {form.responseCount || 0}
                </span>
              </AdminTableCell>
              <AdminTableCell>
                <AdminBadge variant={form.isActive ? "success" : "neutral"}>
                  {form.isActive ? "Active" : "Inactive"}
                </AdminBadge>
              </AdminTableCell>
              <AdminTableCell>
                <span className="text-neutral-500 text-sm">
                  {formatDate(form.createdAt)}
                </span>
              </AdminTableCell>
              <AdminTableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleToggleActive(form.id, form.isActive)}
                    className="p-2 text-neutral-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
                    title={form.isActive ? "Deactivate" : "Activate"}
                  >
                    {form.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </button>
                  <Link
                    href={`/admin/forms/${form.id}`}
                    className="p-2 text-neutral-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <ConfirmDialog
                    trigger={
                      <button
                        className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    }
                    title="Delete Form?"
                    description="Are you sure you want to delete this form? Forms with responses will be deactivated instead."
                    confirmText="Delete"
                    variant="danger"
                    onConfirm={() => handleDelete(form.id)}
                  />
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTableBody>
      </table>
    </div>
  );

  // Mobile card content
  const mobileContent = (
    <div className="space-y-3">
      {forms.map((form) => (
        <MobileCard key={form.id}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <Link
                href={`/admin/forms/${form.id}`}
                className="font-medium text-neutral-900 hover:text-sky-600"
              >
                {form.name}
              </Link>
              {form.description && (
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                  {form.description}
                </p>
              )}
            </div>
            <AdminBadge variant={form.isActive ? "success" : "neutral"}>
              {form.isActive ? "Active" : "Inactive"}
            </AdminBadge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <MobileCardRow label="Questions">{form.questions?.length || 0}</MobileCardRow>
            <MobileCardRow label="Responses">{form.responseCount || 0}</MobileCardRow>
            <MobileCardRow label="Created">{formatDate(form.createdAt)}</MobileCardRow>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleActive(form.id, form.isActive)}
              className="flex-1"
            >
              {form.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/admin/forms/${form.id}`}>Edit</Link>
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              title="Delete Form?"
              description="Are you sure you want to delete this form? Forms with responses will be deactivated instead."
              confirmText="Delete"
              variant="danger"
              onConfirm={() => handleDelete(form.id)}
            />
          </div>
        </MobileCard>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Registration Forms"
        subtitle="Create custom forms to collect additional information during checkout"
      >
          <Button asChild>
            <Link href="/admin/forms/new">
              <Plus className="h-4 w-4 mr-2" />
              New Form
            </Link>
          </Button>
      </AdminPageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{totalForms}</p>
              <p className="text-xs text-neutral-500">Total Forms</p>
            </div>
          </div>
        </AdminCard>
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <ToggleRight className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{activeForms}</p>
              <p className="text-xs text-neutral-500">Active Forms</p>
            </div>
          </div>
        </AdminCard>
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Copy className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{totalResponses}</p>
              <p className="text-xs text-neutral-500">Total Responses</p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Forms List */}
      <AdminCard hover={false}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-neutral-300" />
            <h3 className="mt-4 text-sm font-medium text-neutral-900">
              No forms yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Create your first custom registration form
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/forms/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Link>
            </Button>
          </div>
        ) : (
          <ResponsiveTable mobileView={mobileContent}>
            {tableContent}
          </ResponsiveTable>
        )}
      </AdminCard>

    </div>
  );
}
