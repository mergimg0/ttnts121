"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-black">
              Programs
            </h1>
            <p className="text-neutral-500">Loading...</p>
          </div>
        </div>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-black">
            Programs
          </h1>
          <p className="text-neutral-500">Manage your coaching programs</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/programs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </Link>
        </Button>
      </div>

      {/* Programs List */}
      {programs.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 font-bold text-black">No programs yet</h3>
          <p className="mt-2 text-neutral-500">
            Create your first program to get started
          </p>
          <Button asChild className="mt-6">
            <Link href="/admin/programs/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Link>
          </Button>
        </div>
      ) : (
        <ResponsiveTable
          mobileView={
            programs.map((program) => (
              <MobileCard key={program.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-black">{program.name}</p>
                    <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1">
                      <MapPin className="h-3 w-3" />
                      {program.location}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold uppercase ${
                      program.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {program.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <MobileCardRow label="Type">
                  <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                    {program.serviceType}
                  </span>
                </MobileCardRow>
                <div className="pt-2 border-t border-neutral-100 flex gap-2">
                  <Button variant="secondary" size="sm" asChild className="flex-1">
                    <Link href={`/admin/programs/${program.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(program.id)}
                    disabled={deleting === program.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {programs.map((program) => (
                <tr key={program.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-black">{program.name}</p>
                      <p className="text-sm text-neutral-500">
                        {program.description?.slice(0, 50)}...
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="h-4 w-4" />
                      {program.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                      {program.serviceType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-bold uppercase ${
                        program.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {program.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/programs/${program.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(program.id)}
                        disabled={deleting === program.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleting === program.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
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
