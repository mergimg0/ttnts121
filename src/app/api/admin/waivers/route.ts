import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { WaiverTemplate, CreateWaiverTemplateInput } from "@/types/waiver";

// GET all waiver templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    const sessionId = searchParams.get("sessionId");

    let query = adminDb.collection("waiver_templates").orderBy("createdAt", "desc");

    const snapshot = await query.get();

    let waivers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WaiverTemplate[];

    // Filter by active status if requested
    if (activeOnly) {
      waivers = waivers.filter((w) => w.isActive);
    }

    // Filter by session ID - include waivers that either:
    // 1. Have no sessionIds (applies to all sessions)
    // 2. Include the specified sessionId
    if (sessionId) {
      waivers = waivers.filter((w) => {
        if (!w.sessionIds || w.sessionIds.length === 0) {
          return true; // Applies to all sessions
        }
        return w.sessionIds.includes(sessionId);
      });
    }

    return NextResponse.json({ success: true, data: waivers });
  } catch (error) {
    console.error("Error fetching waivers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch waivers" },
      { status: 500 }
    );
  }
}

// POST create new waiver template
export async function POST(request: NextRequest) {
  try {
    const body: CreateWaiverTemplateInput = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Waiver name is required" },
        { status: 400 }
      );
    }

    if (!body.content?.trim()) {
      return NextResponse.json(
        { success: false, error: "Waiver content is required" },
        { status: 400 }
      );
    }

    const waiverData = {
      name: body.name.trim(),
      content: body.content.trim(),
      sessionIds: body.sessionIds || [],
      isRequired: body.isRequired ?? true,
      isActive: body.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("waiver_templates").add(waiverData);

    // Verify write succeeded
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error("Firebase write verification failed: document not found after create");
      return NextResponse.json(
        { success: false, error: "Failed to verify waiver creation. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...verifyDoc.data() },
      message: "Waiver template created successfully",
    });
  } catch (error) {
    console.error("Error creating waiver:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to create waiver: ${errorMessage}` },
      { status: 500 }
    );
  }
}
