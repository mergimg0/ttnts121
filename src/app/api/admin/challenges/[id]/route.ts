import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { WeeklyChallenge, UpdateWeeklyChallengeInput } from "@/types/challenges";

// GET /api/admin/challenges/[id] - Get a single challenge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await adminDb.collection("weekly_challenges").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Challenge not found" },
        { status: 404 }
      );
    }

    const data = doc.data();
    const challenge: WeeklyChallenge = {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
    } as WeeklyChallenge;

    return NextResponse.json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch challenge" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/challenges/[id] - Update a challenge
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateWeeklyChallengeInput = await request.json();

    const docRef = adminDb.collection("weekly_challenges").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      ...body,
      updatedAt: new Date(),
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.weekStart;
    delete updateData.weekEnd;
    delete updateData.createdAt;

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    const updatedChallenge: WeeklyChallenge = {
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.() || updatedData?.createdAt,
      updatedAt: updatedData?.updatedAt?.toDate?.() || updatedData?.updatedAt,
    } as WeeklyChallenge;

    return NextResponse.json({
      success: true,
      data: updatedChallenge,
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update challenge" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/challenges/[id] - Delete a challenge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docRef = adminDb.collection("weekly_challenges").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Challenge not found" },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Challenge deleted",
    });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete challenge" },
      { status: 500 }
    );
  }
}
