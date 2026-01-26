import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { waitlistConfirmationEmail } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      sessionId,
      childFirstName,
      childLastName,
      ageGroup,
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone,
    } = body;

    // Validate required fields
    if (
      !sessionId ||
      !childFirstName ||
      !childLastName ||
      !parentFirstName ||
      !parentLastName ||
      !parentEmail
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if session exists and is full
    const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const sessionData = sessionDoc.data();
    if (!sessionData?.waitlistEnabled) {
      return NextResponse.json(
        { success: false, error: "Waitlist is not enabled for this session" },
        { status: 400 }
      );
    }

    // Check for existing waitlist entry with same email and session
    const existingEntry = await adminDb
      .collection("waitlist")
      .where("sessionId", "==", sessionId)
      .where("parentEmail", "==", parentEmail)
      .where("status", "in", ["waiting", "notified"])
      .get();

    if (!existingEntry.empty) {
      return NextResponse.json(
        { success: false, error: "You are already on the waitlist for this session" },
        { status: 409 }
      );
    }

    // Get current position on waitlist
    const waitlistSnapshot = await adminDb
      .collection("waitlist")
      .where("sessionId", "==", sessionId)
      .where("status", "in", ["waiting", "notified"])
      .get();

    const position = waitlistSnapshot.size + 1;

    // Create waitlist entry
    const docRef = await adminDb.collection("waitlist").add({
      sessionId,
      childFirstName,
      childLastName,
      ageGroup: ageGroup || "",
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone: parentPhone || "",
      position,
      status: "waiting",
      createdAt: new Date(),
    });

    // Send confirmation email
    const emailContent = waitlistConfirmationEmail({
      parentFirstName,
      childFirstName,
      sessionName: sessionData?.name || "Football Session",
      position,
    });

    const emailResult = await sendEmail({
      to: parentEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!emailResult.success) {
      console.error("Failed to send waitlist confirmation email:", emailResult.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        position,
      },
    });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
