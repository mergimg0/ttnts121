import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { UpdateCampaignInput } from "@/types/contact";

// GET single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const doc = await adminDb.collection("campaigns").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

// PUT update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const body: UpdateCampaignInput = await request.json();

    // Check if campaign exists
    const doc = await adminDb.collection("campaigns").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Only allow editing draft campaigns
    const currentData = doc.data();
    if (currentData?.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "Cannot edit a campaign that has already been sent" },
        { status: 400 }
      );
    }

    // Recalculate recipient count if targeting changed
    let recipientCount = currentData.recipientCount;
    if (body.targetType || body.targetLocations || body.targetContactIds) {
      const targetType = body.targetType || currentData.targetType;
      if (targetType === "all") {
        const contactsSnapshot = await adminDb
          .collection("contacts")
          .where("marketingConsent", "==", true)
          .get();
        recipientCount = contactsSnapshot.size;
      } else if (targetType === "location") {
        const locations = body.targetLocations || currentData.targetLocations || [];
        recipientCount = 0;
        for (const location of locations) {
          const snapshot = await adminDb
            .collection("contacts")
            .where("marketingConsent", "==", true)
            .where("location", "==", location)
            .get();
          recipientCount += snapshot.size;
        }
      } else if (targetType === "custom") {
        const contactIds = body.targetContactIds || currentData.targetContactIds || [];
        recipientCount = contactIds.length;
      }
    }

    const updateData = {
      ...body,
      recipientCount,
      updatedAt: new Date(),
    };

    await adminDb.collection("campaigns").doc(id).update(updateData);

    // Verify update
    const verifyDoc = await adminDb.collection("campaigns").doc(id).get();

    return NextResponse.json({
      success: true,
      data: { id, ...verifyDoc.data() },
      message: "Campaign updated successfully",
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update campaign: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    // Check if campaign exists
    const doc = await adminDb.collection("campaigns").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    await adminDb.collection("campaigns").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to delete campaign: ${errorMessage}` },
      { status: 500 }
    );
  }
}
