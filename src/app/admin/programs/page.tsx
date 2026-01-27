"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { Plus, Edit, Trash2, Calendar, MapPin, Loader2 } from "lucide-react";
import { Program } from "@/types/booking";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch("/api/admin/programs");
      const data = await response.json();
      if (data.success) {
        setPrograms(data.data);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this program? This will also delete all associated sessions.")) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/programs/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPrograms(programs.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting program:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Programs"
          subtitle="Loading..."
        />
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Programs"
        subtitle="Manage your coaching programs"
      >
        <Button variant="adminPrimary" asChild>
          <Link href="/admin/programs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </Link>
        </Button>
      </AdminPageHeader>

      {/* Programs List */}
      {programs.length === 0 ? (
        <AdminEmptyState
          icon={Calendar}
          title="No programs yet"
          description="Create your first program to get started"
          action={
            <Button variant="adminPrimary" asChild>
              <Link href="/admin/programs/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Program
              </Link>
            </Button>
          }
        />
      ) : (
        <ResponsiveTable
          mobileView={
            programs.map((program) => (
              <MobileCard key={program.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-neutral-900">{program.name}</p>
                    <div className="flex items-center gap-2 text-[13px] text-neutral-500 mt-1">
                      <MapPin className="h-3 w-3" />
                      {program.location}
                    </div>
                  </div>
                  <AdminBadge variant={program.isActive ? "success" : "neutral"}>
                    {program.isActive ? "Active" : "Inactive"}
                  </AdminBadge>
                </div>
                <MobileCardRow label="Type">
                  <AdminBadge variant="info">{program.serviceType}</AdminBadge>
                </MobileCardRow>
                <div className="pt-3 border-t border-neutral-100 flex gap-2">
                  <Button variant="adminSecondary" size="sm" asChild className="flex-1">
                    <Link href={`/admin/programs/${program.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="adminGhost"
                    size="sm"
                    onClick={() => handleDelete(program.id)}
                    disabled={deleting === program.id}
                    className="text-red-500 hover:text-red-600"
                  >
                    {deleting === program.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </MobileCard>
            ))
          }
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Program
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {programs.map((program) => (
                <tr key={program.id} className="group hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{program.name}</p>
                      <p className="text-[13px] text-neutral-500 truncate max-w-[200px]">
                        {program.description?.slice(0, 50)}...
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="h-4 w-4 text-neutral-400" />
                      {program.location}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <AdminBadge variant="info">{program.serviceType}</AdminBadge>
                  </td>
                  <td className="px-4 py-4">
                    <AdminBadge variant={program.isActive ? "success" : "neutral"}>
                      {program.isActive ? "Active" : "Inactive"}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/programs/${program.id}`}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(program.id)}
                        disabled={deleting === program.id}
                        className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting === program.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
