"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import {
  Check,
  X,
  Clock,
  MessageSquare,
  UserPlus,
  CheckCheck,
} from "lucide-react";
import { GDSStudent, GDSAttendee } from "@/types/gds";
import { cn } from "@/lib/utils";

interface GDSAttendanceListProps {
  students: GDSStudent[];
  getAttendee: (student: GDSStudent) => GDSAttendee;
  localAttendees: Map<string, GDSAttendee>;
  onAttendeeChange: (studentId: string, attendee: GDSAttendee) => void;
  onBulkCheckIn: () => void;
  date: string;
}

export function GDSAttendanceList({
  students,
  getAttendee,
  localAttendees,
  onAttendeeChange,
  onBulkCheckIn,
  date,
}: GDSAttendanceListProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [showAddWalkIn, setShowAddWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState("");

  const handleCheckIn = (student: GDSStudent) => {
    const current = localAttendees.get(student.id) || getAttendee(student);
    const newCheckedIn = !current.checkedIn;

    onAttendeeChange(student.id, {
      ...current,
      checkedIn: newCheckedIn,
      checkedInAt: newCheckedIn ? new Date() : undefined,
    });
  };

  const handleNotesChange = (student: GDSStudent, notes: string) => {
    const current = localAttendees.get(student.id) || getAttendee(student);
    onAttendeeChange(student.id, {
      ...current,
      notes,
    });
  };

  const toggleNotes = (studentId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleAddWalkIn = () => {
    if (!walkInName.trim()) return;

    // Create a temporary ID for walk-in
    const walkInId = `walk-in-${Date.now()}`;
    const walkInAttendee: GDSAttendee = {
      studentName: walkInName.trim(),
      checkedIn: true,
      checkedInAt: new Date(),
      paymentStatus: "payg",
      notes: "Walk-in registration",
    };

    onAttendeeChange(walkInId, walkInAttendee);
    setWalkInName("");
    setShowAddWalkIn(false);
  };

  const formatTime = (date: Date | { seconds: number } | undefined) => {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  // Calculate checked in count
  const checkedInCount = students.filter((s) => {
    const attendee = localAttendees.get(s.id) || getAttendee(s);
    return attendee.checkedIn;
  }).length;

  return (
    <AdminCard padding={false}>
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-neutral-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Attendance Register
            </h3>
            <p className="text-sm text-neutral-500">
              {checkedInCount} of {students.length} checked in
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="adminSecondary"
              size="sm"
              onClick={() => setShowAddWalkIn(!showAddWalkIn)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Walk-in
            </Button>
            <Button
              variant="adminPrimary"
              size="sm"
              onClick={onBulkCheckIn}
              disabled={checkedInCount === students.length}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Check All In
            </Button>
          </div>
        </div>

        {/* Walk-in Form */}
        {showAddWalkIn && (
          <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="flex gap-3">
              <div className="flex-1">
                <AdminInput
                  placeholder="Student name"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddWalkIn();
                    if (e.key === "Escape") setShowAddWalkIn(false);
                  }}
                />
              </div>
              <Button variant="adminPrimary" onClick={handleAddWalkIn}>
                Add
              </Button>
              <Button variant="adminSecondary" onClick={() => setShowAddWalkIn(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table/List */}
      <ResponsiveTable
        mobileView={
          students.map((student) => {
            const attendee = localAttendees.get(student.id) || getAttendee(student);
            const isCheckedIn = attendee.checkedIn;
            const hasNotes = !!attendee.notes;

            return (
              <MobileCard key={student.id}>
                <div className="flex justify-between items-start">
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
                  <button
                    onClick={() => handleCheckIn(student)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all",
                      isCheckedIn
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    {isCheckedIn ? (
                      <>
                        <Check className="h-4 w-4" />
                        In
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Out
                      </>
                    )}
                  </button>
                </div>

                {isCheckedIn && (
                  <MobileCardRow label="Check-in Time">
                    <span className="text-[13px] text-neutral-600">
                      {formatTime(attendee.checkedInAt)}
                    </span>
                  </MobileCardRow>
                )}

                {student.paymentType && (
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
                      {student.paymentType.toUpperCase()}
                    </AdminBadge>
                  </MobileCardRow>
                )}

                {/* Notes */}
                <div className="pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => toggleNotes(student.id)}
                    className="flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-700"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {hasNotes ? "Edit note" : "Add note"}
                  </button>

                  {expandedNotes.has(student.id) && (
                    <div className="mt-2">
                      <textarea
                        value={attendee.notes || ""}
                        onChange={(e) => handleNotesChange(student, e.target.value)}
                        placeholder="Add notes..."
                        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                        rows={2}
                      />
                    </div>
                  )}

                  {hasNotes && !expandedNotes.has(student.id) && (
                    <p className="mt-1 text-[13px] text-neutral-500 truncate">
                      {attendee.notes}
                    </p>
                  )}
                </div>
              </MobileCard>
            );
          })
        }
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400 w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Student
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Check-in
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Notes
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {students.map((student, index) => {
              const attendee = localAttendees.get(student.id) || getAttendee(student);
              const isCheckedIn = attendee.checkedIn;
              const hasNotes = !!attendee.notes;

              return (
                <tr
                  key={student.id}
                  className={cn(
                    "group transition-colors",
                    isCheckedIn
                      ? "bg-green-50/30 hover:bg-green-50/50"
                      : "hover:bg-neutral-50/50"
                  )}
                >
                  <td className="px-4 py-4 text-sm text-neutral-400">
                    {index + 1}
                  </td>
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
                    {student.paymentType && (
                      <AdminBadge
                        variant={
                          student.paymentType === "block" || student.paymentType === "monthly"
                            ? "success"
                            : student.paymentType === "trial"
                            ? "info"
                            : "warning"
                        }
                      >
                        {student.paymentType.toUpperCase()}
                      </AdminBadge>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <AdminBadge variant={isCheckedIn ? "success" : "warning"}>
                      {isCheckedIn ? "Checked In" : "Not Arrived"}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-4">
                    {isCheckedIn ? (
                      <div className="flex items-center gap-1.5 text-[13px] text-neutral-600">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(attendee.checkedInAt)}
                      </div>
                    ) : (
                      <span className="text-[13px] text-neutral-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="max-w-[200px]">
                      {expandedNotes.has(student.id) ? (
                        <textarea
                          value={attendee.notes || ""}
                          onChange={(e) => handleNotesChange(student, e.target.value)}
                          placeholder="Add notes..."
                          className="w-full px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                          rows={2}
                          autoFocus
                          onBlur={() => toggleNotes(student.id)}
                        />
                      ) : (
                        <button
                          onClick={() => toggleNotes(student.id)}
                          className={cn(
                            "flex items-center gap-1.5 text-[13px] transition-colors",
                            hasNotes
                              ? "text-neutral-600 hover:text-neutral-900"
                              : "text-neutral-400 hover:text-neutral-600"
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {hasNotes ? (
                            <span className="truncate max-w-[150px]">{attendee.notes}</span>
                          ) : (
                            "Add"
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => handleCheckIn(student)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all",
                        isCheckedIn
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-neutral-100 text-neutral-600 hover:bg-sky-100 hover:text-sky-700"
                      )}
                    >
                      {isCheckedIn ? (
                        <>
                          <Check className="h-4 w-4" />
                          In
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Out
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ResponsiveTable>
    </AdminCard>
  );
}
