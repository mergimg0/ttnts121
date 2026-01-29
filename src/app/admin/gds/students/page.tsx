"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminBadge, StatusBadge } from "@/components/admin/ui/admin-badge";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminInput } from "@/components/admin/ui/admin-input";
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Trophy,
  Calendar,
  TrendingUp,
  X,
  Check,
} from "lucide-react";
import {
  GDSDay,
  GDSAgeGroup,
  GDSStudent,
  GDSStudentStatus,
  GDS_DAY_LABELS,
  GDS_AGE_GROUP_LABELS,
  GDS_STUDENT_STATUS_LABELS,
} from "@/types/gds";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

const GDS_DAYS: GDSDay[] = ["monday", "wednesday", "saturday"];
const AGE_GROUPS: GDSAgeGroup[] = ["Y1-Y2", "Y3-Y4", "Y5-Y6", "Y6-Y7"];
const STUDENT_STATUSES: GDSStudentStatus[] = ["active", "inactive", "trial"];

interface StudentFormData {
  studentName: string;
  day: GDSDay;
  ageGroup: GDSAgeGroup;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  medicalConditions: string;
  notes: string;
  paymentType: "block" | "monthly" | "payg" | "trial";
  status: GDSStudentStatus;
}

const defaultFormData: StudentFormData = {
  studentName: "",
  day: "monday",
  ageGroup: "Y3-Y4",
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  medicalConditions: "",
  notes: "",
  paymentType: "payg",
  status: "active",
};

export default function GDSStudentsPage() {
  const [selectedDay, setSelectedDay] = useState<GDSDay | "all">("all");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<GDSAgeGroup | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<GDSStudentStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [students, setStudents] = useState<GDSStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<GDSStudent | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDay !== "all") params.set("day", selectedDay);
      if (selectedAgeGroup !== "all") params.set("ageGroup", selectedAgeGroup);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/gds/students?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDay, selectedAgeGroup, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Group students by day/age group for summary
  const summary = useMemo(() => {
    const byDay = new Map<GDSDay, number>();
    const byAgeGroup = new Map<GDSAgeGroup, number>();

    students.forEach((s) => {
      byDay.set(s.day, (byDay.get(s.day) || 0) + 1);
      byAgeGroup.set(s.ageGroup, (byAgeGroup.get(s.ageGroup) || 0) + 1);
    });

    return { byDay, byAgeGroup };
  }, [students]);

  const handleOpenAddModal = () => {
    setFormData(defaultFormData);
    setEditingStudent(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (student: GDSStudent) => {
    setFormData({
      studentName: student.studentName,
      day: student.day,
      ageGroup: student.ageGroup,
      parentName: student.parentName || "",
      parentEmail: student.parentEmail || "",
      parentPhone: student.parentPhone || "",
      medicalConditions: student.medicalConditions || "",
      notes: student.notes || "",
      paymentType: student.paymentType || "payg",
      status: student.status,
    });
    setEditingStudent(student);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingStudent(null);
    setFormData(defaultFormData);
  };

  const handleSaveStudent = async () => {
    if (!formData.studentName.trim()) {
      toast("Student name is required", "error");
      return;
    }

    setSaving(true);
    try {
      const method = editingStudent ? "PUT" : "POST";
      const url = editingStudent
        ? `/api/admin/gds/students/${editingStudent.id}`
        : "/api/admin/gds/students";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast(
          `${formData.studentName} has been ${editingStudent ? "updated" : "added"}`,
          "success"
        );
        handleCloseModal();
        fetchStudents();
      } else {
        throw new Error(result.error || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving student:", error);
      toast("Failed to save student. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (student: GDSStudent) => {
    try {
      const response = await fetch(`/api/admin/gds/students/${student.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast(`${student.studentName} has been removed`, "success");
        fetchStudents();
      } else {
        throw new Error(result.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast("Failed to remove student. Please try again.", "error");
    }
  };

  const getAttendanceRateVariant = (rate: number): "success" | "warning" | "error" => {
    if (rate >= 80) return "success";
    if (rate >= 50) return "warning";
    return "error";
  };

  const formatDate = (date: Date | { seconds: number } | undefined) => {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="GDS Students"
        subtitle="Manage student roster for Group Development Sessions"
      >
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="adminSecondary" asChild className="flex-1 sm:flex-none">
            <Link href="/admin/gds">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button variant="adminPrimary" onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </AdminPageHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
              <Users className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">Total Students</p>
              <p className="text-xl font-bold text-neutral-900">
                {isLoading ? "-" : students.length}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">Active</p>
              <p className="text-xl font-bold text-green-600">
                {isLoading ? "-" : students.filter((s) => s.status === "active").length}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">On Trial</p>
              <p className="text-xl font-bold text-blue-600">
                {isLoading ? "-" : students.filter((s) => s.status === "trial").length}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">Total POS Awards</p>
              <p className="text-xl font-bold text-amber-600">
                {isLoading ? "-" : students.reduce((acc, s) => acc + s.playerOfSessionCount, 0)}
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <AdminInput
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 lg:w-auto">
            <AdminSelect
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as GDSDay | "all")}
              options={[
                { value: "all", label: "All Days" },
                ...GDS_DAYS.map((d) => ({ value: d, label: GDS_DAY_LABELS[d] })),
              ]}
            />
            <AdminSelect
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value as GDSAgeGroup | "all")}
              options={[
                { value: "all", label: "All Ages" },
                ...AGE_GROUPS.map((ag) => ({ value: ag, label: GDS_AGE_GROUP_LABELS[ag] })),
              ]}
            />
            <AdminSelect
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as GDSStudentStatus | "all")}
              options={[
                { value: "all", label: "All Status" },
                ...STUDENT_STATUSES.map((s) => ({ value: s, label: GDS_STUDENT_STATUS_LABELS[s] })),
              ]}
            />
          </div>
        </div>
      </AdminCard>

      {/* Students Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : students.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No students found"
          description={
            searchQuery || selectedDay !== "all" || selectedAgeGroup !== "all" || selectedStatus !== "all"
              ? "Try adjusting your filters"
              : "Add your first GDS student to get started"
          }
          action={
            !searchQuery && selectedDay === "all" && selectedAgeGroup === "all" && selectedStatus === "all" ? (
              <Button variant="adminPrimary" onClick={handleOpenAddModal}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ResponsiveTable
          mobileView={
            students.map((student) => (
              <MobileCard key={student.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {student.studentName}
                    </p>
                    <p className="text-[13px] text-neutral-500">
                      {GDS_AGE_GROUP_LABELS[student.ageGroup]} - {GDS_DAY_LABELS[student.day]}
                    </p>
                  </div>
                  <StatusBadge status={student.status} />
                </div>

                {student.parentName && (
                  <MobileCardRow label="Parent">
                    <span className="text-sm">{student.parentName}</span>
                  </MobileCardRow>
                )}

                <MobileCardRow label="Attendance">
                  <span className="text-sm font-medium">
                    {student.totalAttendances} sessions
                  </span>
                </MobileCardRow>

                <MobileCardRow label="POS Awards">
                  <span className="text-sm font-medium text-amber-600">
                    {student.playerOfSessionCount}
                  </span>
                </MobileCardRow>

                <MobileCardRow label="Payment">
                  <AdminBadge
                    variant={
                      student.paymentType === "block" || student.paymentType === "monthly"
                        ? "success"
                        : student.paymentType === "trial"
                        ? "info"
                        : "warning"
                    }
                  >
                    {student.paymentType?.toUpperCase() || "PAYG"}
                  </AdminBadge>
                </MobileCardRow>

                <div className="pt-3 border-t border-neutral-100 flex gap-2">
                  <Button
                    variant="adminSecondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenEditModal(student)}
                  >
                    <Edit2 className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="adminSecondary"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Remove ${student.studentName}? This cannot be undone.`)) {
                        handleDeleteStudent(student);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
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
                  Student
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Day / Age
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Attendance
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  POS
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {students.map((student) => (
                <tr key={student.id} className="group hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {student.studentName}
                      </p>
                      {student.parentName && (
                        <p className="text-[13px] text-neutral-500">
                          {student.parentName}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {GDS_DAY_LABELS[student.day]}
                      </p>
                      <p className="text-[13px] text-neutral-500">
                        {GDS_AGE_GROUP_LABELS[student.ageGroup]}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={student.status} />
                  </td>
                  <td className="px-4 py-4">
                    <AdminBadge
                      variant={
                        student.paymentType === "block" || student.paymentType === "monthly"
                          ? "success"
                          : student.paymentType === "trial"
                          ? "info"
                          : "warning"
                      }
                    >
                      {student.paymentType?.toUpperCase() || "PAYG"}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">
                        {student.totalAttendances}
                      </span>
                      {student.lastAttendedAt && (
                        <span className="text-[11px] text-neutral-400">
                          Last: {formatDate(student.lastAttendedAt)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-600">
                        {student.playerOfSessionCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditModal(student)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${student.studentName}? This cannot be undone.`)) {
                            handleDeleteStudent(student);
                          }
                        }}
                        className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {editingStudent ? "Edit Student" : "Add Student"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <AdminInput
                label="Student Name *"
                value={formData.studentName}
                onChange={(e) =>
                  setFormData({ ...formData, studentName: e.target.value })
                }
                placeholder="Enter student name"
              />

              <div className="grid grid-cols-2 gap-4">
                <AdminSelect
                  label="Training Day *"
                  value={formData.day}
                  onChange={(e) =>
                    setFormData({ ...formData, day: e.target.value as GDSDay })
                  }
                  options={GDS_DAYS.map((d) => ({
                    value: d,
                    label: GDS_DAY_LABELS[d],
                  }))}
                />
                <AdminSelect
                  label="Age Group *"
                  value={formData.ageGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, ageGroup: e.target.value as GDSAgeGroup })
                  }
                  options={AGE_GROUPS.map((ag) => ({
                    value: ag,
                    label: GDS_AGE_GROUP_LABELS[ag],
                  }))}
                />
              </div>

              <AdminInput
                label="Parent/Guardian Name"
                value={formData.parentName}
                onChange={(e) =>
                  setFormData({ ...formData, parentName: e.target.value })
                }
                placeholder="Enter parent name"
              />

              <div className="grid grid-cols-2 gap-4">
                <AdminInput
                  label="Parent Email"
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, parentEmail: e.target.value })
                  }
                  placeholder="email@example.com"
                />
                <AdminInput
                  label="Parent Phone"
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, parentPhone: e.target.value })
                  }
                  placeholder="07..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AdminSelect
                  label="Payment Type"
                  value={formData.paymentType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentType: e.target.value as "block" | "monthly" | "payg" | "trial",
                    })
                  }
                  options={[
                    { value: "block", label: "Block Booking" },
                    { value: "monthly", label: "Monthly" },
                    { value: "payg", label: "Pay As You Go" },
                    { value: "trial", label: "Trial" },
                  ]}
                />
                <AdminSelect
                  label="Status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as GDSStudentStatus })
                  }
                  options={STUDENT_STATUSES.map((s) => ({
                    value: s,
                    label: GDS_STUDENT_STATUS_LABELS[s],
                  }))}
                />
              </div>

              <AdminInput
                label="Medical Conditions"
                value={formData.medicalConditions}
                onChange={(e) =>
                  setFormData({ ...formData, medicalConditions: e.target.value })
                }
                placeholder="Any medical conditions to be aware of"
              />

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  className={cn(
                    "flex min-h-[80px] w-full rounded-xl border bg-white px-4 py-3",
                    "text-sm text-neutral-900 placeholder:text-neutral-400",
                    "transition-all duration-200 resize-none",
                    "focus:outline-none focus:ring-2",
                    "border-neutral-200 focus:border-sky-500 focus:ring-sky-500/20"
                  )}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-neutral-100 px-6 py-4 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <Button variant="adminSecondary" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button variant="adminPrimary" onClick={handleSaveStudent} disabled={saving}>
                  {saving ? "Saving..." : editingStudent ? "Update" : "Add Student"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
