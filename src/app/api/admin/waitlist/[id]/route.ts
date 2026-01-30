import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const { id } = await params;
    const doc = await adminDb.collection("waitlist").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching waitlist entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch waitlist entry" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const { id } = await params;
    const body = await request.json();

    await adminDb
      .collection("waitlist")
      .doc(id)
      .update({
        ...body,
        updatedAt: new Date(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating waitlist entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update waitlist entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const { id } = await params;
    await adminDb.collection("waitlist").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting waitlist entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete waitlist entry" },
      { status: 500 }
    );
  }
}
