import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { waitlistSpotAvailableEmail } from "@/lib/email-templates";
import { formatPrice, getDayName } from "@/lib/booking-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the waitlist entry
    const doc = await adminDb.collection("waitlist").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    const entry = doc.data();

    if (!entry) {
      return NextResponse.json(
        { success: false, error: "Waitlist entry data missing" },
        { status: 404 }
      );
    }

    // Get session details for the email
    const sessionDoc = await adminDb.collection("sessions").doc(entry.sessionId).get();
    const session = sessionDoc.exists ? sessionDoc.data() : null;

    // Calculate expiry (48 hours from notification)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Build the booking URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const bookingUrl = `${baseUrl}/sessions?highlight=${entry.sessionId}`;

    // Generate and send email
    const emailContent = waitlistSpotAvailableEmail({
      parentFirstName: entry.parentFirstName,
      childFirstName: entry.childFirstName,
      sessionName: session?.name || "Football Session",
      dayOfWeek: session ? getDayName(session.dayOfWeek) : "TBC",
      startTime: session?.startTime || "TBC",
      endTime: session?.endTime || "TBC",
      price: session ? formatPrice(session.price) : "TBC",
      bookingUrl,
      expiresAt: expiresAt.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    const emailResult = await sendEmail({
      to: entry.parentEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!emailResult.success) {
      console.error("Failed to send waitlist notification email:", emailResult.error);
      // Still update status but note the email failure
    }

    // Update the waitlist entry status
    await adminDb.collection("waitlist").doc(id).update({
      status: "notified",
      notifiedAt: new Date(),
      expiresAt,
      emailSent: emailResult.success,
      emailId: emailResult.id,
    });

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${entry.parentEmail}`,
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Error notifying waitlist entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
