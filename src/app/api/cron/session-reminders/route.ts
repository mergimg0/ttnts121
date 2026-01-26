import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { generateSessionReminderEmail } from "@/lib/email-templates/session-reminder";
import { getDayName } from "@/lib/booking-utils";
import { LOCATIONS } from "@/lib/constants";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Schedule: Every day at 6:00 PM (to remind parents about tomorrow's sessions)
// Vercel cron config in vercel.json: {"schedule": "0 18 * * *"}

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get tomorrow's day of week (0-6, where 0 is Sunday)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayOfWeek = tomorrow.getDay();

    // Format tomorrow's date for display
    const tomorrowFormatted = tomorrow.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Get all sessions happening tomorrow
    const sessionsSnapshot = await adminDb
      .collection("sessions")
      .where("dayOfWeek", "==", tomorrowDayOfWeek)
      .where("isActive", "==", true)
      .get();

    if (sessionsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No sessions scheduled for tomorrow",
        reminders_sent: 0,
      });
    }

    const sessionIds = sessionsSnapshot.docs.map((doc) => doc.id);

    // Get all active bookings for tomorrow's sessions
    const bookingsSnapshot = await adminDb
      .collection("bookings")
      .where("sessionId", "in", sessionIds)
      .where("paymentStatus", "==", "paid")
      .get();

    if (bookingsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No bookings for tomorrow's sessions",
        reminders_sent: 0,
      });
    }

    // Create a map of session details
    const sessionsMap = new Map<string, {
      name: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      programId: string;
    }>();

    for (const doc of sessionsSnapshot.docs) {
      const session = doc.data();
      sessionsMap.set(doc.id, {
        name: session.name,
        dayOfWeek: session.dayOfWeek,
        startTime: session.startTime,
        endTime: session.endTime,
        programId: session.programId,
      });
    }

    // Get program details for locations
    const programIds = [...new Set([...sessionsMap.values()].map((s) => s.programId))];
    const programsMap = new Map<string, string>();

    for (const programId of programIds) {
      const programDoc = await adminDb.collection("programs").doc(programId).get();
      if (programDoc.exists) {
        const locationId = programDoc.data()?.location;
        const location = LOCATIONS.find((l) => l.id === locationId);
        programsMap.set(programId, location?.name || locationId);
      }
    }

    // Send reminder emails
    let remindersSent = 0;
    const errors: string[] = [];

    for (const doc of bookingsSnapshot.docs) {
      const booking = doc.data();
      const session = sessionsMap.get(booking.sessionId);

      if (!session) continue;

      const location = programsMap.get(session.programId) || "TBC";

      try {
        const emailHtml = generateSessionReminderEmail({
          childFirstName: booking.childFirstName,
          parentFirstName: booking.parentFirstName,
          sessionName: session.name,
          dayOfWeek: getDayName(session.dayOfWeek),
          startTime: session.startTime,
          endTime: session.endTime,
          location,
          sessionDate: tomorrowFormatted,
        });

        const result = await sendEmail({
          to: booking.parentEmail,
          subject: `Reminder: ${booking.childFirstName}'s Football Session Tomorrow`,
          html: emailHtml,
        });

        if (result.success) {
          remindersSent++;
        } else {
          errors.push(`Failed to send to ${booking.parentEmail}: ${result.error}`);
        }
      } catch (error) {
        errors.push(
          `Error sending to ${booking.parentEmail}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      reminders_sent: remindersSent,
      total_bookings: bookingsSnapshot.size,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Session reminders cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
