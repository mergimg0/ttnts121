import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("waitlist")
      .orderBy("createdAt", "desc")
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const docRef = await adminDb.collection("waitlist").add({
      ...body,
      status: "waiting",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { id: docRef.id },
    });
  } catch (error) {
    console.error("Error creating waitlist entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create waitlist entry" },
      { status: 500 }
    );
  }
}
