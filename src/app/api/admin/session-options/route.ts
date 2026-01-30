import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { SessionOption, CreateSessionOptionInput } from "@/types/session-option";

// GET /api/admin/session-options - List all session options
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const query: FirebaseFirestore.Query = adminDb
      .collection("session_options")
      .orderBy("createdAt", "desc");

    const snapshot = await query.get();

    let options: SessionOption[] = [];
    snapshot.forEach((doc) => {
      options.push({
        id: doc.id,
        ...doc.data(),
      } as SessionOption);
    });

    // Filter by active status if requested
    if (activeOnly) {
      options = options.filter((opt) => opt.isActive);
    }

    // Filter by sessionId if provided
    // Options apply to a session if sessionIds is empty/undefined OR if sessionId is in the list
    if (sessionId) {
      options = options.filter(
        (opt) =>
          !opt.sessionIds ||
          opt.sessionIds.length === 0 ||
          opt.sessionIds.includes(sessionId)
      );
    }

    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("Error fetching session options:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch session options" },
      { status: 500 }
    );
  }
}

// POST /api/admin/session-options - Create a new session option
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreateSessionOptionInput = await request.json();
    const { name, description, price, sessionIds, maxQuantity, isRequired, isActive } = body;

    // Validate required fields
    if (!name || price === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, price" },
        { status: 400 }
      );
    }

    // Validate price is non-negative
    if (price < 0) {
      return NextResponse.json(
        { success: false, error: "Price must be 0 or greater" },
        { status: 400 }
      );
    }

    // Validate maxQuantity if provided
    if (maxQuantity !== undefined && maxQuantity < 1) {
      return NextResponse.json(
        { success: false, error: "Max quantity must be at least 1" },
        { status: 400 }
      );
    }

    const now = new Date();

    const optionData: Omit<SessionOption, "id"> = {
      name: name.trim(),
      description: description?.trim() || undefined,
      price,
      sessionIds: sessionIds && sessionIds.length > 0 ? sessionIds : undefined,
      maxQuantity: maxQuantity || 1,
      isRequired: isRequired || false,
      isActive: isActive !== false, // Default to true
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection("session_options").add(optionData);

    // Verify write succeeded
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error("Firebase write verification failed: document not found after create");
      return NextResponse.json(
        { success: false, error: "Failed to verify option creation. Please try again." },
        { status: 500 }
      );
    }

    const sessionOption: SessionOption = {
      id: docRef.id,
      ...optionData,
    };

    return NextResponse.json({
      success: true,
      data: sessionOption,
      message: "Session option created successfully",
    });
  } catch (error) {
    console.error("Error creating session option:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to create session option: ${errorMessage}` },
      { status: 500 }
    );
  }
}
