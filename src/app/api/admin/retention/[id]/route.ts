import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { LostCustomer, UpdateLostCustomerInput } from "@/types/retention";

// GET /api/admin/retention/[id] - Get a single lost customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;

    const doc = await adminDb.collection("lost_customers").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Lost customer record not found" },
        { status: 404 }
      );
    }

    const data = doc.data();
    const customer: LostCustomer = {
      id: doc.id,
      ...data,
      lostAt: data?.lostAt?.toDate?.() || data?.lostAt,
      lastContactedAt: data?.lastContactedAt?.toDate?.() || data?.lastContactedAt,
      returnedAt: data?.returnedAt?.toDate?.() || data?.returnedAt,
      addedAt: data?.addedAt?.toDate?.() || data?.addedAt,
      updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
      followUpHistory: (data?.followUpHistory || []).map((entry: any) => ({
        ...entry,
        date: entry.date?.toDate?.() || entry.date,
      })),
    } as LostCustomer;

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error fetching lost customer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lost customer record" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/retention/[id] - Update a lost customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;
    const body: UpdateLostCustomerInput = await request.json();

    const docRef = adminDb.collection("lost_customers").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Lost customer record not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      ...body,
      updatedAt: new Date(),
    };

    // Convert date strings to Date objects
    if (body.lostAt) {
      updateData.lostAt = new Date(body.lostAt as any);
    }
    if (body.lastContactedAt) {
      updateData.lastContactedAt = new Date(body.lastContactedAt as any);
    }
    if (body.returnedAt) {
      updateData.returnedAt = new Date(body.returnedAt as any);
    }

    // Normalize email if provided
    if (body.parentEmail) {
      updateData.parentEmail = body.parentEmail.toLowerCase();
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.followUpHistory;
    delete updateData.totalFollowUps;
    delete updateData.addedAt;

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    const updatedCustomer: LostCustomer = {
      id: updatedDoc.id,
      ...updatedData,
      lostAt: updatedData?.lostAt?.toDate?.() || updatedData?.lostAt,
      lastContactedAt: updatedData?.lastContactedAt?.toDate?.() || updatedData?.lastContactedAt,
      returnedAt: updatedData?.returnedAt?.toDate?.() || updatedData?.returnedAt,
      addedAt: updatedData?.addedAt?.toDate?.() || updatedData?.addedAt,
      updatedAt: updatedData?.updatedAt?.toDate?.() || updatedData?.updatedAt,
    } as LostCustomer;

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating lost customer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update lost customer record" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/retention/[id] - Delete a lost customer record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    const docRef = adminDb.collection("lost_customers").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Lost customer record not found" },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Permanently delete
      await docRef.delete();
    } else {
      // Soft delete - mark as declined/archived
      await docRef.update({
        status: "declined",
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? "Record deleted" : "Record archived",
    });
  } catch (error) {
    console.error("Error deleting lost customer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete lost customer record" },
      { status: 500 }
    );
  }
}
