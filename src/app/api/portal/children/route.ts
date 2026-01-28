import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { User, UserChild } from "@/types/user";
import { FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

// Helper to verify user from session
async function verifyUserSession(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// GET user's children
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyUserSession(request);

    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Get user document
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = userDoc.data() as User;
    const children = user.children || [];

    return NextResponse.json({
      success: true,
      data: children,
    });
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch children" },
      { status: 500 }
    );
  }
}

// POST add a new child
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyUserSession(request);

    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.dob) {
      return NextResponse.json(
        { success: false, error: "First name, last name, and date of birth are required" },
        { status: 400 }
      );
    }

    // Create new child object
    const newChild: UserChild = {
      id: uuidv4(),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      dob: new Date(body.dob),
      medicalConditions: body.medicalConditions?.trim() || undefined,
    };

    // Add child to user's children array
    await adminDb
      .collection("users")
      .doc(userId)
      .update({
        children: FieldValue.arrayUnion(newChild),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      success: true,
      data: newChild,
    });
  } catch (error) {
    console.error("Error adding child:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add child" },
      { status: 500 }
    );
  }
}
