import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { UpdateContactInput } from "@/types/contact";

// GET single contact with consent logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("contacts").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    // Get consent logs
    const consentLogsSnapshot = await adminDb
      .collection("contacts")
      .doc(id)
      .collection("consent_logs")
      .orderBy("timestamp", "desc")
      .get();

    const consentLogs = consentLogsSnapshot.docs.map((logDoc) => ({
      id: logDoc.id,
      ...logDoc.data(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
        consentLogs,
      },
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

// PUT update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateContactInput = await request.json();

    // Get current contact for consent comparison
    const currentDoc = await adminDb.collection("contacts").doc(id).get();
    if (!currentDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    const currentData = currentDoc.data();
    const consentChanged =
      body.marketingConsent !== undefined &&
      body.marketingConsent !== currentData?.marketingConsent;

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    // If consent changed, update timestamp
    if (consentChanged) {
      updateData.consentTimestamp = new Date();
    }

    await adminDb.collection("contacts").doc(id).update(updateData);

    // If consent changed, create consent log
    if (consentChanged) {
      await adminDb
        .collection("contacts")
        .doc(id)
        .collection("consent_logs")
        .add({
          contactId: id,
          action: body.marketingConsent ? "granted" : "revoked",
          timestamp: new Date(),
          method: "admin",
        });
    }

    // Verify update
    const verifyDoc = await adminDb.collection("contacts").doc(id).get();

    return NextResponse.json({
      success: true,
      data: { id, ...verifyDoc.data() },
      message: "Contact updated successfully",
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update contact: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if contact exists
    const doc = await adminDb.collection("contacts").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    // Delete consent logs subcollection
    const consentLogs = await adminDb
      .collection("contacts")
      .doc(id)
      .collection("consent_logs")
      .get();

    const batch = adminDb.batch();
    consentLogs.docs.forEach((logDoc) => {
      batch.delete(logDoc.ref);
    });
    await batch.commit();

    // Delete contact
    await adminDb.collection("contacts").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to delete contact: ${errorMessage}` },
      { status: 500 }
    );
  }
}
