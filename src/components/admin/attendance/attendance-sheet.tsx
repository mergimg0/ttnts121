"use client";

import { useState } from "react";
import { AttendanceRecord } from "@/types/attendance";
import { Booking } from "@/types/booking";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { CheckinButton } from "./checkin-button";
import { Clock, User, MessageSquare } from "lucide-react";

interface AttendanceSheetProps {
  sessionId: string;
  sessionName: string;
  date: string;
  bookings: Booking[];
  attendanceRecords: AttendanceRecord[];
  onCheckinChange: () => void;
}

export function AttendanceSheet({
  sessionId,
  sessionName,
  date,
  bookings,
  attendanceRecords,
  onCheckinChange,
}: AttendanceSheetProps) {
  // Build attendance data for each enrolled child
  const attendanceData = bookings.map((booking) => {
    const childName = `${booking.childFirstName} ${booking.childLastName}`;
    const record = attendanceRecords.find(
      (r) => r.bookingId === booking.id && r.childName === childName
    );

    return {
      booking,
      childName,
      record,
      isCheckedIn: !!record?.checkedInAt,
      isCheckedOut: !!record?.checkedOutAt,
    };
  });

  const formatTime = (date: Date | { seconds: number } | undefined) => {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <ResponsiveTable
      mobileView={
        attendanceData.map(({ booking, childName, record, isCheckedIn, isCheckedOut }) => (
          <MobileCard key={booking.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-neutral-900">{childName}</p>
                <p className="text-[13px] text-neutral-500">{booking.ageGroup}</p>
              </div>
              <div className="flex gap-1.5">
                {isCheckedIn && (
                  <AdminBadge variant={isCheckedOut ? "neutral" : "success"}>
                    {isCheckedOut ? "Out" : "In"}
                  </AdminBadge>
                )}
                {!isCheckedIn && (
                  <AdminBadge variant="warning">Not arrived</AdminBadge>
                )}
              </div>
            </div>

            <MobileCardRow label="Parent">
              <p className="text-sm text-neutral-600">
                {booking.parentFirstName} {booking.parentLastName}
              </p>
            </MobileCardRow>

            {isCheckedIn && (
              <MobileCardRow label="Check-in">
                <span className="text-[13px] text-neutral-600">
                  {formatTime(record?.checkedInAt)} ({record?.method})
                </span>
              </MobileCardRow>
            )}

            {isCheckedOut && (
              <MobileCardRow label="Check-out">
                <span className="text-[13px] text-neutral-600">
                  {formatTime(record?.checkedOutAt)}
                </span>
              </MobileCardRow>
            )}

            {record?.notes && (
              <div className="pt-2 border-t border-neutral-100">
                <div className="flex items-start gap-2 text-[13px] text-neutral-500">
                  <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{record.notes}</span>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-neutral-100 flex gap-2">
              <CheckinButton
                bookingId={booking.id}
                sessionId={sessionId}
                childName={childName}
                date={date}
                isCheckedIn={isCheckedIn}
                isCheckedOut={isCheckedOut}
                onSuccess={onCheckinChange}
              />
            </div>
          </MobileCard>
        ))
      }
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Child
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Parent
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Check-in
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Check-out
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Notes
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {attendanceData.map(({ booking, childName, record, isCheckedIn, isCheckedOut }) => (
            <tr key={booking.id} className="group hover:bg-neutral-50/50 transition-colors">
              <td className="px-4 py-4">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{childName}</p>
                  <p className="text-[13px] text-neutral-500">{booking.ageGroup}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                <div>
                  <p className="text-sm text-neutral-600">
                    {booking.parentFirstName} {booking.parentLastName}
                  </p>
                  <p className="text-[13px] text-neutral-500">{booking.parentPhone}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                {isCheckedIn ? (
                  <AdminBadge variant={isCheckedOut ? "neutral" : "success"}>
                    {isCheckedOut ? "Checked Out" : "Checked In"}
                  </AdminBadge>
                ) : (
                  <AdminBadge variant="warning">Not Arrived</AdminBadge>
                )}
              </td>
              <td className="px-4 py-4">
                {isCheckedIn ? (
                  <div className="flex items-center gap-1.5 text-[13px] text-neutral-600">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(record?.checkedInAt)}
                    <span className="text-neutral-400">({record?.method})</span>
                  </div>
                ) : (
                  <span className="text-[13px] text-neutral-400">-</span>
                )}
              </td>
              <td className="px-4 py-4">
                {isCheckedOut ? (
                  <div className="flex items-center gap-1.5 text-[13px] text-neutral-600">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(record?.checkedOutAt)}
                  </div>
                ) : (
                  <span className="text-[13px] text-neutral-400">-</span>
                )}
              </td>
              <td className="px-4 py-4">
                {record?.notes ? (
                  <div className="flex items-center gap-1.5 text-[13px] text-neutral-500 max-w-[200px]">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{record.notes}</span>
                  </div>
                ) : (
                  <span className="text-[13px] text-neutral-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 text-right">
                <CheckinButton
                  bookingId={booking.id}
                  sessionId={sessionId}
                  childName={childName}
                  date={date}
                  isCheckedIn={isCheckedIn}
                  isCheckedOut={isCheckedOut}
                  onSuccess={onCheckinChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ResponsiveTable>
  );
}
