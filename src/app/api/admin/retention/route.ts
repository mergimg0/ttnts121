import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { Timestamp } from "firebase-admin/firestore";
import {
  LostCustomer,
  CreateLostCustomerInput,
  LostCustomerStatus,
  LostReason,
  LostCustomerSummary,
  daysSince,
} from "@/types/retention";

// Helper to safely convert Firestore Timestamp to Date
function toDate(value: Date | Timestamp | any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return new Date();
}

// GET /api/admin/retention - List lost customers with filters
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as LostCustomerStatus | null;
    const lostReason = searchParams.get("lostReason") as LostReason | null;
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "lostAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query: FirebaseFirestore.Query = adminDb.collection("lost_customers");

    // Apply filters
    if (status) {
      // Handle multiple statuses (comma-separated)
      const statuses = status.split(",") as LostCustomerStatus[];
      if (statuses.length === 1) {
        query = query.where("status", "==", statuses[0]);
      } else if (statuses.length > 1) {
        query = query.where("status", "in", statuses);
      }
    }

    if (lostReason) {
      query = query.where("lostReason", "==", lostReason);
    }

    if (priority) {
      query = query.where("priority", "==", parseInt(priority));
    }

    // Apply sorting
    const validSortFields = ["lostAt", "catchUpDate", "lastContactedAt", "priority", "addedAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "lostAt";
    query = query.orderBy(sortField, sortOrder);

    // Get total count first (for pagination)
    const countSnapshot = await adminDb.collection("lost_customers").count().get();
    const total = countSnapshot.data().count;

    // Apply pagination
    query = query.limit(limit + offset);

    const snapshot = await query.get();

    let customers: LostCustomerSummary[] = [];
    const now = new Date();

    snapshot.forEach((doc) => {
      const data = doc.data() as LostCustomer;

      // Apply search filter (client-side for flexibility)
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          data.studentName?.toLowerCase().includes(searchLower) ||
          data.parentName?.toLowerCase().includes(searchLower) ||
          data.parentEmail?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return;
      }

      const lostAt = toDate(data.lostAt);
      const lastContactedAt = data.lastContactedAt ? toDate(data.lastContactedAt) : undefined;

      const summary: LostCustomerSummary = {
        id: doc.id,
        studentName: data.studentName,
        parentName: data.parentName,
        parentEmail: data.parentEmail,
        status: data.status,
        lostReason: data.lostReason,
        lastSessionDate: data.lastSessionDate,
        catchUpDate: data.catchUpDate,
        daysSinceLost: daysSince(lostAt),
        daysSinceContact: lastContactedAt ? daysSince(lastContactedAt) : undefined,
        totalFollowUps: data.totalFollowUps || 0,
        priority: data.priority || 3,
        nextStepNotes: data.nextStepNotes,
      };

      customers.push(summary);
    });

    // Apply offset (skip first N results)
    customers = customers.slice(offset, offset + limit);

    // Calculate quick metrics
    const allDocs = await adminDb.collection("lost_customers").get();
    let totalLost = 0;
    let totalReturned = 0;
    let needsFollowUp = 0;

    allDocs.forEach((doc) => {
      const data = doc.data();
      if (data.status === "returned") {
        totalReturned++;
      } else if (data.status !== "declined") {
        totalLost++;
        // Check if needs follow-up (no catchUpDate or overdue)
        if (!data.catchUpDate || new Date(data.catchUpDate) < now) {
          needsFollowUp++;
        }
      }
    });

    const returnRate = totalLost + totalReturned > 0
      ? Math.round((totalReturned / (totalLost + totalReturned)) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        customers,
        total,
        hasMore: offset + customers.length < total,
        metrics: {
          totalLost,
          totalReturned,
          returnRate,
          needsFollowUp,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching lost customers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lost customers" },
      { status: 500 }
    );
  }
}

// POST /api/admin/retention - Create a new lost customer record
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const body: CreateLostCustomerInput = await request.json();
    const {
      studentName,
      studentId,
      parentName,
      parentEmail,
      parentPhone,
      parentId,
      lastSessionDate,
      lastSessionType,
      previousCoach,
      previousCoachId,
      totalSessionsAttended,
      lostReason,
      lostReasonDetails,
      lostAt,
      catchUpDate,
      nextStepNotes,
      priority = 2,
      tags,
      addedBy,
    } = body;

    // Validate required fields
    if (!studentName || !parentName || !parentEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: studentName, parentName, parentEmail" },
        { status: 400 }
      );
    }

    // Check if customer already exists (by email + student name)
    const existingSnapshot = await adminDb
      .collection("lost_customers")
      .where("parentEmail", "==", parentEmail.toLowerCase())
      .where("studentName", "==", studentName)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "A record for this student already exists" },
        { status: 400 }
      );
    }

    const now = new Date();

    const customerData: Omit<LostCustomer, "id"> = {
      studentName,
      studentId: studentId || undefined,
      parentName,
      parentEmail: parentEmail.toLowerCase(),
      parentPhone: parentPhone || undefined,
      parentId: parentId || undefined,
      lastSessionDate: lastSessionDate || undefined,
      lastSessionType: lastSessionType || undefined,
      previousCoach: previousCoach || undefined,
      previousCoachId: previousCoachId || undefined,
      totalSessionsAttended: totalSessionsAttended || undefined,
      lostReason: lostReason || "unknown",
      lostReasonDetails: lostReasonDetails || undefined,
      lostAt: lostAt ? new Date(lostAt as any) : now,
      status: "lost",
      catchUpDate: catchUpDate || undefined,
      nextStepNotes: nextStepNotes || undefined,
      followUpHistory: [],
      totalFollowUps: 0,
      priority,
      tags: tags || undefined,
      addedBy: addedBy || undefined,
      addedAt: now,
      updatedAt: now,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(customerData).filter(([_, v]) => v !== undefined)
    );

    const docRef = await adminDb.collection("lost_customers").add(cleanData);

    const customer: LostCustomer = {
      id: docRef.id,
      ...customerData,
    };

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error creating lost customer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create lost customer record" },
      { status: 500 }
    );
  }
}
