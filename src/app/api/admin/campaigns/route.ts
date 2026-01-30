import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { Campaign, CreateCampaignInput } from "@/types/contact";

// GET list campaigns
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = adminDb.collection("campaigns").orderBy("createdAt", "desc");

    if (status) {
      query = adminDb
        .collection("campaigns")
        .where("status", "==", status)
        .orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();

    const campaigns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Campaign[];

    return NextResponse.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST create new campaign
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreateCampaignInput = await request.json();

    // Validate required fields
    if (!body.name || !body.subject || !body.body) {
      return NextResponse.json(
        { success: false, error: "Name, subject, and body are required" },
        { status: 400 }
      );
    }

    // Calculate recipient count based on targeting
    let recipientCount = 0;
    if (body.targetType === "all") {
      const contactsSnapshot = await adminDb
        .collection("contacts")
        .where("marketingConsent", "==", true)
        .get();
      recipientCount = contactsSnapshot.size;
    } else if (body.targetType === "location" && body.targetLocations?.length) {
      // Need to query each location separately due to Firestore limitations
      for (const location of body.targetLocations) {
        const snapshot = await adminDb
          .collection("contacts")
          .where("marketingConsent", "==", true)
          .where("location", "==", location)
          .get();
        recipientCount += snapshot.size;
      }
    } else if (body.targetType === "custom" && body.targetContactIds?.length) {
      recipientCount = body.targetContactIds.length;
    }

    const campaignData = {
      ...body,
      status: "draft",
      recipientCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("campaigns").add(campaignData);

    // Verify write
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Failed to verify campaign creation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...verifyDoc.data() },
      message: "Campaign created successfully",
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to create campaign: ${errorMessage}` },
      { status: 500 }
    );
  }
}
