import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { Program, CreateProgramInput } from "@/types/booking";

// GET all programs
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const snapshot = await adminDb
      .collection("programs")
      .orderBy("createdAt", "desc")
      .get();

    const programs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Program[];

    return NextResponse.json({ success: true, data: programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}

// POST create new program
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreateProgramInput = await request.json();

    const programData = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("programs").add(programData);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...programData },
    });
  } catch (error) {
    console.error("Error creating program:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create program" },
      { status: 500 }
    );
  }
}
