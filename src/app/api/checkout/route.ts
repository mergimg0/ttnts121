import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { generateBookingRef, calculateAgeGroup } from "@/lib/booking-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customerDetails, secondaryParent, guardianDeclaration, paymentType, depositInfo } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items in cart" },
        { status: 400 }
      );
    }

    // Validate guardian declaration
    if (!guardianDeclaration?.accepted || !guardianDeclaration?.signature?.trim()) {
      return NextResponse.json(
        { success: false, error: "Guardian declaration is required" },
        { status: 400 }
      );
    }

    // Get IP address and user agent for audit trail
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Generate booking reference
    const bookingRef = generateBookingRef();

    // Calculate age group from DOB
    const childDOB = new Date(customerDetails.childDOB);
    const ageGroup = calculateAgeGroup(childDOB);

    // Calculate total
    const totalAmount = items.reduce(
      (sum: number, item: { price: number }) => sum + item.price,
      0
    );

    // Determine if this is a deposit payment
    const isDepositPayment = paymentType === "deposit" && depositInfo?.enabled;
    const chargeAmount = isDepositPayment ? depositInfo.depositAmount : totalAmount;

    // Create line items for Stripe
    const lineItems = isDepositPayment
      ? [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: `Deposit - ${items.map((i: { name: string }) => i.name).join(", ")}`,
                description: `Deposit payment. Balance of £${((depositInfo.balanceDue) / 100).toFixed(2)} due by ${new Date(depositInfo.balanceDueDate).toLocaleDateString("en-GB")}`,
              },
              unit_amount: depositInfo.depositAmount,
            },
            quantity: 1,
          },
        ]
      : items.map((item: { name: string; price: number }) => ({
          price_data: {
            currency: "gbp",
            product_data: {
              name: item.name,
            },
            unit_amount: item.price,
          },
          quantity: 1,
        }));

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
      // Secondary parent/guardian (optional)
      secondaryParent: secondaryParent ? {
        name: secondaryParent.name,
        email: secondaryParent.email || null,
        phone: secondaryParent.phone,
        relationship: secondaryParent.relationship,
        canPickup: secondaryParent.canPickup,
        receiveEmails: secondaryParent.receiveEmails,
      } : null,
      medicalConditions: customerDetails.medicalConditions || null,
      marketingConsent: customerDetails.marketingConsent || false,
      // Guardian declaration for legal compliance
      guardianDeclaration: {
        accepted: guardianDeclaration.accepted,
        signature: guardianDeclaration.signature.trim(),
        childrenNames: guardianDeclaration.childrenNames || [],
        ipAddress,
        userAgent,
        acceptedAt: new Date(guardianDeclaration.acceptedAt),
      },
      amount: totalAmount,
      paymentStatus: "pending",
      // Deposit payment tracking
      paymentType: isDepositPayment ? "deposit" : "full",
      ...(isDepositPayment && {
        depositPaid: depositInfo.depositAmount,
        balanceDue: depositInfo.balanceDue,
        balanceDueDate: new Date(depositInfo.balanceDueDate),
      }),
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
        paymentType: isDepositPayment ? "deposit" : "full",
        ...(isDepositPayment && {
          depositAmount: String(depositInfo.depositAmount),
          balanceDue: String(depositInfo.balanceDue),
          balanceDueDate: new Date(depositInfo.balanceDueDate).toISOString(),
        }),
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
