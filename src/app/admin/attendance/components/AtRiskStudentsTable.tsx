"use client";

import { cn } from "@/lib/utils";
import { AtRiskStudent } from "@/types/attendance";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type SortField = "childName" | "rate" | "enrolled" | "attended" | "consecutiveMissed";
type SortDirection = "asc" | "desc";

interface AtRiskStudentsTableProps {
  students: AtRiskStudent[];
  className?: string;
}

export function AtRiskStudentsTable({
  students,
  className,
}: AtRiskStudentsTableProps) {
  const [sortField, setSortField] = useState<SortField>("rate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "rate" ? "asc" : "desc");
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "childName":
        comparison = a.childName.localeCompare(b.childName);
        break;
      case "rate":
        comparison = a.rate - b.rate;
        break;
      case "enrolled":
        comparison = a.enrolled - b.enrolled;
        break;
      case "attended":
        comparison = a.attended - b.attended;
        break;
      case "consecutiveMissed":
        comparison = a.consecutiveMissed - b.consecutiveMissed;
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
    );
  };

  const getRateBadgeStyles = (rate: number) => {
    if (rate < 50) {
      return "bg-red-50 text-red-700 border-red-200";
    } else if (rate < 70) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-neutral-50 text-neutral-700 border-neutral-200";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  if (students.length === 0) {
    return (
      <div className={cn("", className)}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h4 className="text-[13px] font-semibold text-neutral-900">
            At-Risk Students
          </h4>
        </div>
        <div className="flex flex-col items-center justify-center py-12 bg-neutral-50 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm text-neutral-600 font-medium">All students are on track</p>
          <p className="text-xs text-neutral-500 mt-1">
            No students with attendance below 70%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h4 className="text-[13px] font-semibold text-neutral-900">
          At-Risk Students
        </h4>
        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          {students.length} {students.length === 1 ? "student" : "students"}
        </span>
      </div>

      <p className="text-xs text-neutral-500 mb-4">
        Students with attendance rate below 70% or 3+ consecutive missed sessions.
      </p>

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th
                className="px-4 py-3 text-left font-medium text-neutral-600 cursor-pointer hover:bg-neutral-100 transition-colors"
                onClick={() => handleSort("childName")}
              >
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon field="childName" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center font-medium text-neutral-600 cursor-pointer hover:bg-neutral-100 transition-colors"
                onClick={() => handleSort("enrolled")}
              >
                <div className="flex items-center justify-center gap-1">
                  Sessions
                  <SortIcon field="enrolled" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center font-medium text-neutral-600 cursor-pointer hover:bg-neutral-100 transition-colors"
                onClick={() => handleSort("attended")}
              >
                <div className="flex items-center justify-center gap-1">
                  Attended
                  <SortIcon field="attended" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center font-medium text-neutral-600 cursor-pointer hover:bg-neutral-100 transition-colors"
                onClick={() => handleSort("rate")}
              >
                <div className="flex items-center justify-center gap-1">
                  Rate
                  <SortIcon field="rate" />
                </div>
              </th>
              <th className="px-4 py-3 text-center font-medium text-neutral-600">
                Last Seen
              </th>
              <th
                className="px-4 py-3 text-center font-medium text-neutral-600 cursor-pointer hover:bg-neutral-100 transition-colors"
                onClick={() => handleSort("consecutiveMissed")}
              >
                <div className="flex items-center justify-center gap-1">
                  Missed
                  <SortIcon field="consecutiveMissed" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, index) => (
              <tr
                key={student.bookingId}
                className={cn(
                  "border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors",
                  index % 2 === 0 ? "bg-white" : "bg-neutral-50/30"
                )}
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-neutral-900">
                    {student.childName}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-neutral-600 tabular-nums">
                  {student.enrolled}
                </td>
                <td className="px-4 py-3 text-center text-neutral-600 tabular-nums">
                  {student.attended}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tabular-nums",
                      getRateBadgeStyles(student.rate)
                    )}
                  >
                    {student.rate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-neutral-600 text-xs">
                  {formatDate(student.lastAttended)}
                </td>
                <td className="px-4 py-3 text-center">
                  {student.consecutiveMissed >= 3 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      <AlertTriangle className="w-3 h-3" />
                      {student.consecutiveMissed}
                    </span>
                  ) : (
                    <span className="text-neutral-600 tabular-nums">
                      {student.consecutiveMissed}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-neutral-400 mt-3 text-center">
        Sorted by {sortField === "childName" ? "name" : sortField} ({sortDirection === "asc" ? "ascending" : "descending"})
      </p>
    </div>
  );
}
