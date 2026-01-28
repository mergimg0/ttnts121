import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Contact, CreateContactInput } from "@/types/contact";

// GET list contacts with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();
    const location = searchParams.get("location");
    const marketingConsent = searchParams.get("marketingConsent");
    const source = searchParams.get("source");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    let query = adminDb.collection("contacts").orderBy("createdAt", "desc");

    // Apply filters that Firestore can handle
    if (location) {
      query = adminDb
        .collection("contacts")
        .where("location", "==", location)
        .orderBy("createdAt", "desc");
    }

    if (marketingConsent !== null && marketingConsent !== undefined) {
      const consentBool = marketingConsent === "true";
      query = adminDb
        .collection("contacts")
        .where("marketingConsent", "==", consentBool)
        .orderBy("createdAt", "desc");
    }

    if (source) {
      query = adminDb
        .collection("contacts")
        .where("source", "==", source)
        .orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();

    let contacts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Contact[];

    // Apply search filter in memory (Firestore doesn't support partial text search)
    if (search) {
      contacts = contacts.filter(
        (c) =>
          c.email.toLowerCase().includes(search) ||
          c.firstName.toLowerCase().includes(search) ||
          c.lastName.toLowerCase().includes(search)
      );
    }

    const total = contacts.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedContacts = contacts.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      success: true,
      data: paginatedContacts,
      total,
      page,
      pageSize,
      hasMore: startIndex + pageSize < total,
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST create new contact
export async function POST(request: NextRequest) {
  try {
    const body: CreateContactInput = await request.json();

    // Validate email
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingContact = await adminDb
      .collection("contacts")
      .where("email", "==", body.email.toLowerCase())
      .limit(1)
      .get();

    if (!existingContact.empty) {
      return NextResponse.json(
        { success: false, error: "A contact with this email already exists" },
        { status: 400 }
      );
    }

    const contactData = {
      ...body,
      email: body.email.toLowerCase(),
      marketingConsent: body.marketingConsent ?? false,
      consentTimestamp: body.marketingConsent ? new Date() : null,
      source: body.source || "manual",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("contacts").add(contactData);

    // Verify write
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Failed to verify contact creation" },
        { status: 500 }
      );
    }

    // If consent was granted, create consent log
    if (body.marketingConsent) {
      await adminDb
        .collection("contacts")
        .doc(docRef.id)
        .collection("consent_logs")
        .add({
          contactId: docRef.id,
          action: "granted",
          timestamp: new Date(),
          method: "admin",
        });
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...verifyDoc.data() },
      message: "Contact created successfully",
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to create contact: ${errorMessage}` },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
