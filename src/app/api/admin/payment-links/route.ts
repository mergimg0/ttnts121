import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { createPaymentLink } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { paymentLinkEmail } from "@/lib/email-templates";
import { CreatePaymentLinkInput, PaymentLink } from "@/types/payment";

// GET /api/admin/payment-links - List all payment links
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // active, completed, expired, cancelled
    const limit = parseInt(searchParams.get("limit") || "50");

    let query: FirebaseFirestore.Query = adminDb
      .collection("payment_links")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();

    const paymentLinks: PaymentLink[] = [];
    snapshot.forEach((doc) => {
      paymentLinks.push({
        id: doc.id,
        ...doc.data(),
      } as PaymentLink);
    });

    return NextResponse.json({
      success: true,
      data: paymentLinks,
    });
  } catch (error) {
    console.error("Error fetching payment links:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment links" },
      { status: 500 }
    );
  }
}

// POST /api/admin/payment-links - Create a new payment link
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreatePaymentLinkInput = await request.json();
    const {
      customerEmail,
      customerName,
      amount,
      description,
      bookingId,
      expiryDays = 7,
      metadata = {},
    } = body;

    // Validate required fields
    if (!customerEmail || !amount || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: customerEmail, amount, description" },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Calculate expiry date
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    // Create Stripe payment link
    const stripeResult = await createPaymentLink({
      amount,
      description,
      customerEmail,
      metadata: {
        ...metadata,
        bookingId: bookingId || '',
        customerName: customerName || '',
      },
      expiresAfterDays: expiryDays,
    });

    // Store payment link in Firestore
    const paymentLinkData: Omit<PaymentLink, 'id'> = {
      bookingId: bookingId || undefined,
      customerEmail,
      customerName: customerName || undefined,
      amount,
      description,
      stripePaymentLinkId: stripeResult.paymentLinkId,
      stripePaymentLinkUrl: stripeResult.paymentLinkUrl,
      stripePriceId: stripeResult.priceId,
      stripeProductId: stripeResult.productId,
      status: 'active',
      expiresAt,
      metadata,
      createdBy: 'admin', // TODO: Get actual admin user from session
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection("payment_links").add(paymentLinkData);

    const paymentLink: PaymentLink = {
      id: docRef.id,
      ...paymentLinkData,
    };

    // Send payment link email to customer
    try {
      const emailContent = paymentLinkEmail({
        customerEmail,
        customerName: customerName || customerEmail.split('@')[0],
        amount,
        description,
        paymentLinkUrl: stripeResult.paymentLinkUrl,
        expiryDate: expiresAt.toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });

      await sendEmail({
        to: customerEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailError) {
      console.error("Failed to send payment link email:", emailError);
      // Don't fail the request if email fails - link was created successfully
    }

    return NextResponse.json({
      success: true,
      data: paymentLink,
    });
  } catch (error) {
    console.error("Error creating payment link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment link" },
      { status: 500 }
    );
  }
}
