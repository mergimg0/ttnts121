import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Booking, Session } from "@/types/booking";
import * as XLSX from "xlsx";
import Papa from "papaparse";

// Helper to convert Firestore timestamp to date string
function formatTimestamp(timestamp: unknown): string {
  if (!timestamp) return "";
  if (typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return String(timestamp);
}

// GET export attendance (bookings grouped by session for attendance tracking)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sessionId = searchParams.get("sessionId");

    // Validate format
    if (format !== "csv" && format !== "xlsx") {
      return NextResponse.json(
        { success: false, error: "Invalid format. Use 'csv' or 'xlsx'" },
        { status: 400 }
      );
    }

    // Fetch sessions for session names
    const sessionsSnapshot = await adminDb.collection("sessions").get();
    const sessionsMap = new Map<string, Session>();
    sessionsSnapshot.docs.forEach((doc) => {
      sessionsMap.set(doc.id, { id: doc.id, ...doc.data() } as Session);
    });

    // Fetch bookings (only paid ones for attendance)
    const query = adminDb
      .collection("bookings")
      .where("paymentStatus", "==", "paid")
      .orderBy("createdAt", "desc");

    const snapshot = await query.get();

    let bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];

    // Apply filters
    if (sessionId) {
      bookings = bookings.filter((b) => b.sessionId === sessionId);
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      bookings = bookings.filter((b) => {
        const bookingDate = new Date(formatTimestamp(b.createdAt));
        return bookingDate >= fromDate;
      });
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      bookings = bookings.filter((b) => {
        const bookingDate = new Date(formatTimestamp(b.createdAt));
        return bookingDate <= toDate;
      });
    }

    // Transform data for attendance export
    const exportData = bookings.map((booking) => {
      const session = sessionsMap.get(booking.sessionId);
      return {
        "Session Name": session?.name || booking.sessionId,
        "Session Day": session
          ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][session.dayOfWeek]
          : "",
        "Session Time": session
          ? `${session.startTime} - ${session.endTime}`
          : "",
        "Child Name": `${booking.childFirstName} ${booking.childLastName}`,
        "Age Group": booking.ageGroup,
        "Parent Name": `${booking.parentFirstName} ${booking.parentLastName}`,
        "Contact Phone": booking.parentPhone,
        "Contact Email": booking.parentEmail,
        "Medical Conditions": booking.medicalConditions || "None",
        "Emergency Contact": booking.emergencyContact?.name || "",
        "Emergency Phone": booking.emergencyContact?.phone || "",
        "Booking Ref": booking.bookingRef,
        "Checked In": "", // Empty column for manual attendance marking
      };
    });

    // Sort by session name, then child name
    exportData.sort((a, b) => {
      const sessionCompare = a["Session Name"].localeCompare(b["Session Name"]);
      if (sessionCompare !== 0) return sessionCompare;
      return a["Child Name"].localeCompare(b["Child Name"]);
    });

    // Generate file based on format
    if (format === "csv") {
      const csv = Papa.unparse(exportData);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv;charset=utf-8;",
          "Content-Disposition": `attachment; filename="attendance-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else {
      // Excel format
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");

      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      ws["!cols"] = colWidths;

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="attendance-export-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting attendance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export attendance" },
      { status: 500 }
    );
  }
}
