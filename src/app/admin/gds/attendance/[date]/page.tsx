"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { GDSAttendanceList } from "@/components/admin/gds/GDSAttendanceList";
import { PlayerOfSessionSelector } from "@/components/admin/gds/PlayerOfSessionSelector";
import {
  ArrowLeft,
  Users,
  RefreshCw,
  Save,
  ClipboardCheck,
  Trophy,
  Calendar,
} from "lucide-react";
import {
  GDSDay,
  GDSAgeGroup,
  GDSAttendance,
  GDSStudent,
  GDSAttendee,
  PlayerOfSessionAward,
  GDS_DAY_LABELS,
  GDS_AGE_GROUP_LABELS,
  getGDSDayFromDate,
} from "@/types/gds";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

const AGE_GROUPS: GDSAgeGroup[] = ["Y1-Y2", "Y3-Y4", "Y5-Y6", "Y6-Y7"];

export default function GDSAttendanceDatePage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;

  const [selectedAgeGroup, setSelectedAgeGroup] = useState<GDSAgeGroup>("Y3-Y4");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [students, setStudents] = useState<GDSStudent[]>([]);
  const [attendance, setAttendance] = useState<GDSAttendance | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  // Determine the day from the date
  const dateObj = new Date(date);
  const day = getGDSDayFromDate(dateObj) || "monday";

  // Fetch students for the selected day/age group
  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/gds/students?day=${day}&ageGroup=${selectedAgeGroup}&status=active`
      );
      const data = await response.json();
      if (data.success) {
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setStudentsLoading(false);
    }
  }, [day, selectedAgeGroup]);

  // Fetch existing attendance record for this date/age group
  const fetchAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    try {
      const response = await fetch(
        `/api/admin/gds/attendance/${date}?ageGroup=${selectedAgeGroup}`
      );
      const data = await response.json();
      if (data.success) {
        setAttendance(data.data || null);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setAttendanceLoading(false);
    }
  }, [date, selectedAgeGroup]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Local state for attendance modifications
  const [localAttendees, setLocalAttendees] = useState<Map<string, GDSAttendee>>(new Map());
  const [localPlayerOfSession, setLocalPlayerOfSession] = useState<PlayerOfSessionAward | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Build attendance map
  const getAttendeeForStudent = useCallback((student: GDSStudent): GDSAttendee => {
    // Check local state first
    if (localAttendees.has(student.id)) {
      return localAttendees.get(student.id)!;
    }

    // Check existing attendance record
    if (attendance?.attendees) {
      const existing = attendance.attendees.find(
        (a) => a.studentId === student.id || a.studentName === student.studentName
      );
      if (existing) return existing;
    }

    // Return default
    return {
      studentName: student.studentName,
      studentId: student.id,
      checkedIn: false,
    };
  }, [localAttendees, attendance]);

  const handleAttendeeChange = (studentId: string, attendee: GDSAttendee) => {
    setLocalAttendees((prev) => {
      const next = new Map(prev);
      next.set(studentId, attendee);
      return next;
    });
    setHasChanges(true);
  };

  const handlePlayerOfSessionChange = (award: PlayerOfSessionAward | null) => {
    setLocalPlayerOfSession(award);
    setHasChanges(true);
  };

  const handleBulkCheckIn = () => {
    students.forEach((student) => {
      const attendee = getAttendeeForStudent(student);
      if (!attendee.checkedIn) {
        handleAttendeeChange(student.id, {
          ...attendee,
          checkedIn: true,
          checkedInAt: new Date(),
        });
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build attendees list
      const attendees: GDSAttendee[] = students.map((student) => {
        const attendee = getAttendeeForStudent(student);
        return localAttendees.has(student.id)
          ? localAttendees.get(student.id)!
          : attendee;
      });

      const payload = {
        day,
        ageGroup: selectedAgeGroup,
        sessionDate: date,
        attendees,
        totalAttendees: attendees.filter((a) => a.checkedIn).length,
        playerOfSession: localPlayerOfSession || attendance?.playerOfSession || undefined,
      };

      const method = attendance?.id ? "PUT" : "POST";
      const url = attendance?.id
        ? `/api/admin/gds/attendance/${attendance.id}`
        : "/api/admin/gds/attendance";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast(`Attendance saved for ${GDS_AGE_GROUP_LABELS[selectedAgeGroup]}`, "success");
        setHasChanges(false);
        setLocalAttendees(new Map());
        fetchAttendance();
      } else {
        throw new Error(result.error || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast("Failed to save attendance. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStudents(), fetchAttendance()]);
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Calculate stats
  const checkedInCount = students.filter((s) => {
    const attendee = getAttendeeForStudent(s);
    return localAttendees.has(s.id)
      ? localAttendees.get(s.id)!.checkedIn
      : attendee.checkedIn;
  }).length;

  const attendanceRate = students.length > 0
    ? Math.round((checkedInCount / students.length) * 100)
    : 0;

  const currentPlayerOfSession = localPlayerOfSession || attendance?.playerOfSession;
  const checkedInStudents = students.filter((s) => {
    const attendee = getAttendeeForStudent(s);
    return localAttendees.has(s.id)
      ? localAttendees.get(s.id)!.checkedIn
      : attendee.checkedIn;
  });

  const isLoading = studentsLoading || attendanceLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title={`GDS Attendance - ${GDS_DAY_LABELS[day]}`}
        subtitle={formatDate(date)}
      >
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="adminSecondary" asChild className="flex-1 sm:flex-none">
            <Link href="/admin/gds">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button
            variant="adminSecondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button
            variant="adminPrimary"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </AdminPageHeader>

      {/* Age Group Tabs */}
      <div className="flex flex-wrap gap-2">
        {AGE_GROUPS.map((ag) => (
          <button
            key={ag}
            onClick={() => {
              if (hasChanges) {
                if (!confirm("You have unsaved changes. Switch anyway?")) {
                  return;
                }
              }
              setSelectedAgeGroup(ag);
              setLocalAttendees(new Map());
              setLocalPlayerOfSession(null);
              setHasChanges(false);
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              selectedAgeGroup === ag
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            )}
          >
            {GDS_AGE_GROUP_LABELS[ag]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
              <Calendar className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">Session</p>
              <p className="text-lg font-bold text-neutral-900">
                {GDS_DAY_LABELS[day]}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">Enrolled</p>
              <p className="text-lg font-bold text-neutral-900">
                {isLoading ? "-" : students.length}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <ClipboardCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">Checked In</p>
              <p className="text-lg font-bold text-green-600">
                {isLoading ? "-" : `${checkedInCount}/${students.length}`}
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
              <p className="text-[13px] text-neutral-500">Attendance Rate</p>
              <p className="text-lg font-bold text-neutral-900">
                {isLoading ? "-" : `${attendanceRate}%`}
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Player of Session Selector */}
      <PlayerOfSessionSelector
        checkedInStudents={checkedInStudents}
        currentAward={currentPlayerOfSession}
        onAwardChange={handlePlayerOfSessionChange}
        ageGroup={selectedAgeGroup}
        day={day}
      />

      {/* Attendance List */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={4} />
      ) : students.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No students enrolled"
          description={`No active students found for ${GDS_AGE_GROUP_LABELS[selectedAgeGroup]} on ${GDS_DAY_LABELS[day]}`}
          action={
            <Button variant="adminPrimary" asChild>
              <Link href="/admin/gds/students">
                <Users className="mr-2 h-4 w-4" />
                Manage Students
              </Link>
            </Button>
          }
        />
      ) : (
        <GDSAttendanceList
          students={students}
          getAttendee={getAttendeeForStudent}
          localAttendees={localAttendees}
          onAttendeeChange={handleAttendeeChange}
          onBulkCheckIn={handleBulkCheckIn}
          date={date}
        />
      )}
    </div>
  );
}
