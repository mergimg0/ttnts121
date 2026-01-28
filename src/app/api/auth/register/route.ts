import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";

interface RegisterRequestBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  marketingConsent: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequestBody = await request.json();
    const { email, password, firstName, lastName, phone, marketingConsent } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
    });

    // Create Firestore user document
    const userDoc = {
      email,
      firstName,
      lastName,
      phone: phone || null,
      role: "customer" as const,
      children: [],
      marketingConsent,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection("users").doc(userRecord.uid).set(userDoc);

    // Generate email verification link
    const verificationLink = await adminAuth.generateEmailVerificationLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account`,
    });

    // Send welcome email with verification link
    try {
      const emailContent = welcomeEmail({
        firstName,
        verificationLink,
      });
      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
      },
      message: "Account created successfully. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Error in registration:", error);

    // Handle Firebase Auth errors
    const errorCode = (error as { code?: string }).code;
    if (errorCode === "auth/email-already-exists") {
      return NextResponse.json(
        { success: false, error: "This email is already registered" },
        { status: 400 }
      );
    }
    if (errorCode === "auth/invalid-email") {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }
    if (errorCode === "auth/weak-password") {
      return NextResponse.json(
        { success: false, error: "Password is too weak" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
