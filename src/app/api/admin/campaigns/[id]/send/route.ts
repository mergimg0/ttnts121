import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { sendCampaignEmails } from "@/lib/email-campaign";
import { Contact } from "@/types/contact";

// POST - Send campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    // Get campaign
    const campaignDoc = await adminDb.collection("campaigns").doc(id).get();
    if (!campaignDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    const campaign = campaignDoc.data()!;

    // Only allow sending draft campaigns
    if (campaign.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "Campaign has already been sent" },
        { status: 400 }
      );
    }

    // Update status to sending
    await adminDb.collection("campaigns").doc(id).update({
      status: "sending",
      updatedAt: new Date(),
    });

    // Get target contacts based on targeting type
    let contacts: Contact[] = [];

    try {
      if (campaign.targetType === "all") {
        const snapshot = await adminDb
          .collection("contacts")
          .where("marketingConsent", "==", true)
          .get();
        contacts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Contact[];
      } else if (campaign.targetType === "location") {
        const locations = campaign.targetLocations || [];
        for (const location of locations) {
          const snapshot = await adminDb
            .collection("contacts")
            .where("marketingConsent", "==", true)
            .where("location", "==", location)
            .get();
          const locationContacts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Contact[];
          contacts.push(...locationContacts);
        }
        // Deduplicate by email
        const seen = new Set<string>();
        contacts = contacts.filter((c) => {
          if (seen.has(c.email)) return false;
          seen.add(c.email);
          return true;
        });
      } else if (campaign.targetType === "custom") {
        const contactIds = campaign.targetContactIds || [];
        for (const contactId of contactIds) {
          const doc = await adminDb.collection("contacts").doc(contactId).get();
          if (doc.exists) {
            const data = doc.data()!;
            if (data.marketingConsent) {
              contacts.push({ id: doc.id, ...data } as Contact);
            }
          }
        }
      }

      if (contacts.length === 0) {
        await adminDb.collection("campaigns").doc(id).update({
          status: "failed",
          error: "No contacts with marketing consent found",
          updatedAt: new Date(),
        });
        return NextResponse.json(
          { success: false, error: "No contacts with marketing consent found" },
          { status: 400 }
        );
      }

      // Send emails
      const result = await sendCampaignEmails({
        subject: campaign.subject,
        body: campaign.body,
        contacts,
      });

      // Update campaign with results
      await adminDb.collection("campaigns").doc(id).update({
        status: result.failedCount === contacts.length ? "failed" : "sent",
        sentAt: new Date(),
        sentCount: result.successCount,
        failedCount: result.failedCount,
        error: result.failedCount > 0 ? `${result.failedCount} emails failed` : null,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `Campaign sent to ${result.successCount} recipients`,
        data: {
          sentCount: result.successCount,
          failedCount: result.failedCount,
        },
      });
    } catch (sendError) {
      // Mark campaign as failed
      await adminDb.collection("campaigns").doc(id).update({
        status: "failed",
        error: sendError instanceof Error ? sendError.message : "Unknown error",
        updatedAt: new Date(),
      });
      throw sendError;
    }
  } catch (error) {
    console.error("Error sending campaign:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to send campaign: ${errorMessage}` },
      { status: 500 }
    );
  }
}
