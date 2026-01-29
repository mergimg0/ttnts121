import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Booking } from "@/types/booking";
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

// Helper to format price from pence to pounds
function formatPrice(pence: number): string {
  return `${(pence / 100).toFixed(2)}`;
}

// GET export bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sessionId = searchParams.get("sessionId");
    const paymentStatus = searchParams.get("paymentStatus");

    // Validate format
    if (format !== "csv" && format !== "xlsx") {
      return NextResponse.json(
        { success: false, error: "Invalid format. Use 'csv' or 'xlsx'" },
        { status: 400 }
      );
    }

    // Fetch bookings
    const query = adminDb.collection("bookings").orderBy("createdAt", "desc");
    const snapshot = await query.get();

    let bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];

    // Apply filters
    if (sessionId) {
      bookings = bookings.filter((b) => b.sessionId === sessionId);
    }
    if (paymentStatus) {
      bookings = bookings.filter((b) => b.paymentStatus === paymentStatus);
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
      toDate.setHours(23, 59, 59, 999); // Include the entire end date
      bookings = bookings.filter((b) => {
        const bookingDate = new Date(formatTimestamp(b.createdAt));
        return bookingDate <= toDate;
      });
    }

    // Transform data for export
    const exportData = bookings.map((booking) => ({
      "Booking Ref": booking.bookingRef,
      "Child First Name": booking.childFirstName,
      "Child Last Name": booking.childLastName,
      "Age Group": booking.ageGroup,
      "Parent First Name": booking.parentFirstName,
      "Parent Last Name": booking.parentLastName,
      "Parent Email": booking.parentEmail,
      "Parent Phone": booking.parentPhone,
      "Session ID": booking.sessionId,
      "Payment Status": booking.paymentStatus,
      "Amount (GBP)": formatPrice(booking.amount),
      "Booking Date": formatTimestamp(booking.createdAt).split("T")[0],
      "Photo Consent": booking.photoConsent ? "Yes" : "No",
      "Marketing Consent": booking.marketingConsent ? "Yes" : "No",
      "Medical Conditions": booking.medicalConditions || "",
      "Emergency Contact": booking.emergencyContact?.name || "",
      "Emergency Phone": booking.emergencyContact?.phone || "",
    }));

    // Generate file based on format
    if (format === "csv") {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv;charset=utf-8;",
          "Content-Disposition": `attachment; filename="bookings-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else {
      // Excel format
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");

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
          "Content-Disposition": `attachment; filename="bookings-export-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting bookings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export bookings" },
      { status: 500 }
    );
  }
}
