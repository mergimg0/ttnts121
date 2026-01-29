import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  LostCustomer,
  FollowUpEntry,
  AddFollowUpInput,
  LostCustomerStatus,
  ContactMethod,
  FollowUpOutcome,
} from "@/types/retention";

interface FollowUpRequestBody {
  method: ContactMethod;
  notes: string;
  outcome: FollowUpOutcome;
  nextFollowUpDate?: string;
  contactedBy?: string;
  contactedByName?: string;
}

// Helper to safely convert Firestore Timestamp to Date
function toDate(value: Date | Timestamp | any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return undefined;
}

// POST /api/admin/retention/[id]/follow-up - Add a follow-up entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: FollowUpRequestBody = await request.json();
    const { method, notes, outcome, nextFollowUpDate, contactedBy, contactedByName } = body;

    // Validate required fields
    if (!method || !notes || !outcome) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: method, notes, outcome" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("lost_customers").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Lost customer record not found" },
        { status: 404 }
      );
    }

    const existingData = doc.data() as LostCustomer;

    // Create follow-up entry
    const followUpId = `fu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const followUpEntry: FollowUpEntry = {
      id: followUpId,
      date: now,
      method,
      notes,
      contactedBy: contactedBy || "admin",
      contactedByName: contactedByName,
      outcome,
      nextFollowUpDate: nextFollowUpDate || undefined,
    };

    // Determine new status based on outcome
    let newStatus: LostCustomerStatus = existingData.status;
    if (outcome === "scheduled_return") {
      newStatus = "returning";
    } else if (outcome === "declined") {
      newStatus = "declined";
    } else if (outcome === "needs_follow_up" && nextFollowUpDate) {
      newStatus = "follow_up_scheduled";
    } else if (outcome === "spoke" || outcome === "left_message") {
      newStatus = "contacted";
    }

    // Update document
    const updateData: Record<string, any> = {
      followUpHistory: FieldValue.arrayUnion(followUpEntry),
      totalFollowUps: FieldValue.increment(1),
      lastContactedAt: now,
      status: newStatus,
      updatedAt: now,
    };

    // Update catchUpDate if provided
    if (nextFollowUpDate) {
      updateData.catchUpDate = nextFollowUpDate;
    }

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        followUpEntry,
        newStatus,
        totalFollowUps: updatedData?.totalFollowUps || (existingData.totalFollowUps || 0) + 1,
      },
      message: "Follow-up recorded successfully",
    });
  } catch (error) {
    console.error("Error adding follow-up:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add follow-up entry" },
      { status: 500 }
    );
  }
}

// GET /api/admin/retention/[id]/follow-up - Get follow-up history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await adminDb.collection("lost_customers").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Lost customer record not found" },
        { status: 404 }
      );
    }

    const data = doc.data() as LostCustomer;
    const followUpHistory = (data.followUpHistory || []).map((entry: any) => ({
      ...entry,
      date: entry.date?.toDate?.() || entry.date,
    }));

    // Sort by date descending (most recent first)
    followUpHistory.sort((a: any, b: any) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      success: true,
      data: {
        followUpHistory,
        totalFollowUps: data.totalFollowUps || followUpHistory.length,
        lastContactedAt: toDate(data.lastContactedAt),
        currentStatus: data.status,
        nextFollowUpDate: data.catchUpDate,
      },
    });
  } catch (error) {
    console.error("Error fetching follow-up history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch follow-up history" },
      { status: 500 }
    );
  }
}
