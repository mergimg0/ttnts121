import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { UpdateCoachInput } from "@/types/coach";
import type { Timestamp } from "firebase-admin/firestore";

const COACHES_COLLECTION = "coaches";

// Helper to serialize coach data
function serializeCoachData(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    name: data.name,
    abbreviation: data.abbreviation || null,
    email: data.email || null,
    phone: data.phone || null,
    hourlyRate: data.hourlyRate || null,
    sessionRate: data.sessionRate || null,
    isActive: data.isActive ?? true,
    userId: data.userId || undefined,
    createdAt: data.createdAt instanceof Object && "toDate" in data.createdAt
      ? (data.createdAt as Timestamp).toDate()
      : data.createdAt,
    updatedAt: data.updatedAt instanceof Object && "toDate" in data.updatedAt
      ? (data.updatedAt as Timestamp).toDate()
      : data.updatedAt,
  };
}

// GET single coach by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;
    const docRef = adminDb.collection(COACHES_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeCoachData(doc.id, doc.data()!),
    });
  } catch (error) {
    console.error("Error fetching coach:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coach" },
      { status: 500 }
    );
  }
}

// PATCH update coach
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;
    const body: UpdateCoachInput = await request.json();

    const docRef = adminDb.collection(COACHES_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach not found" },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }
    if (body.abbreviation !== undefined) {
      updateData.abbreviation = body.abbreviation?.trim() || null;
    }
    if (body.email !== undefined) {
      updateData.email = body.email?.trim() || null;
    }
    if (body.phone !== undefined) {
      updateData.phone = body.phone?.trim() || null;
    }
    if (body.hourlyRate !== undefined) {
      updateData.hourlyRate = body.hourlyRate;
    }
    if (body.sessionRate !== undefined) {
      updateData.sessionRate = body.sessionRate;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();

    return NextResponse.json({
      success: true,
      data: serializeCoachData(updatedDoc.id, updatedDoc.data()!),
      message: "Coach updated successfully",
    });
  } catch (error) {
    console.error("Error updating coach:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update coach: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE (soft delete - set isActive to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;
    const docRef = adminDb.collection(COACHES_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await docRef.update({
      isActive: false,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Coach deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting coach:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate coach" },
      { status: 500 }
    );
  }
}
