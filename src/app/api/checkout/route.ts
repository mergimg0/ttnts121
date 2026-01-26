import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { generateBookingRef, calculateAgeGroup } from "@/lib/booking-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customerDetails } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items in cart" },
        { status: 400 }
      );
    }

    // Generate booking reference
    const bookingRef = generateBookingRef();

    // Calculate age group from DOB
    const childDOB = new Date(customerDetails.childDOB);
    const ageGroup = calculateAgeGroup(childDOB);

    // Create line items for Stripe
    const lineItems = items.map((item: { name: string; price: number }) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price,
      },
      quantity: 1,
    }));

    // Calculate total
    const totalAmount = items.reduce(
      (sum: number, item: { price: number }) => sum + item.price,
      0
    );

    // Create pending booking record in Firestore
    const bookingData = {
      bookingRef,
      sessionIds: items.map((item: { sessionId: string }) => item.sessionId),
      childFirstName: customerDetails.childFirstName,
      childLastName: customerDetails.childLastName,
      childDOB: childDOB,
      ageGroup,
      parentFirstName: customerDetails.parentFirstName,
      parentLastName: customerDetails.parentLastName,
      parentEmail: customerDetails.parentEmail,
      parentPhone: customerDetails.parentPhone,
      emergencyContact: {
        name: customerDetails.emergencyContactName,
        phone: customerDetails.emergencyContactPhone,
        relationship: customerDetails.emergencyContactRelationship,
      },
      medicalConditions: customerDetails.medicalConditions || null,
      marketingConsent: customerDetails.marketingConsent || false,
      amount: totalAmount,
      paymentStatus: "pending",
      createdAt: new Date(),
    };

    // Store pending booking
    const bookingDoc = await adminDb.collection("bookings").add(bookingData);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}&booking_ref=${bookingRef}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout?cancelled=true`,
      customer_email: customerDetails.parentEmail,
      metadata: {
        bookingId: bookingDoc.id,
        bookingRef,
        sessionIds: JSON.stringify(
          items.map((item: { sessionId: string }) => item.sessionId)
        ),
      },
    });

    // Update booking with Stripe session ID
    await adminDb.collection("bookings").doc(bookingDoc.id).update({
      stripeSessionId: session.id,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      bookingRef,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
