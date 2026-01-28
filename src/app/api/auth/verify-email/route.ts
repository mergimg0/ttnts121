import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing user ID" },
        { status: 400 }
      );
    }

    // Get the current user from Firebase Auth
    const userRecord = await adminAuth.getUser(uid);

    if (!userRecord.emailVerified) {
      return NextResponse.json(
        { success: false, error: "Email not yet verified in Firebase" },
        { status: 400 }
      );
    }

    // Update Firestore user document
    await adminDb.collection("users").doc(uid).update({
      emailVerified: true,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify email" },
      { status: 500 }
    );
  }
}

// GET endpoint to resend verification email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing user ID" },
        { status: 400 }
      );
    }

    // Get user email
    const userRecord = await adminAuth.getUser(uid);

    if (userRecord.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "Email already verified",
        alreadyVerified: true,
      });
    }

    // Generate new verification link
    const verificationLink = await adminAuth.generateEmailVerificationLink(
      userRecord.email!,
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account`,
      }
    );

    return NextResponse.json({
      success: true,
      verificationLink,
      message: "Verification link generated",
    });
  } catch (error) {
    console.error("Error generating verification link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate verification link" },
      { status: 500 }
    );
  }
}
