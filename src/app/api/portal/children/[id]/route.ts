import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { User, UserChild } from "@/types/user";
import { FieldValue } from "firebase-admin/firestore";

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

// GET a specific child
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyUserSession(request);

    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const { id: childId } = await params;

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

    // Find the child
    const child = children.find((c) => c.id === childId);

    if (!child) {
      return NextResponse.json(
        { success: false, error: "Child not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: child,
    });
  } catch (error) {
    console.error("Error fetching child:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch child" },
      { status: 500 }
    );
  }
}

// PUT update a child
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyUserSession(request);

    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const { id: childId } = await params;
    const body = await request.json();

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

    // Find the child to update
    const childIndex = children.findIndex((c) => c.id === childId);

    if (childIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Child not found" },
        { status: 404 }
      );
    }

    // Update child data
    const updatedChild: UserChild = {
      ...children[childIndex],
      firstName: body.firstName?.trim() || children[childIndex].firstName,
      lastName: body.lastName?.trim() || children[childIndex].lastName,
      dob: body.dob ? new Date(body.dob) : children[childIndex].dob,
      medicalConditions:
        body.medicalConditions !== undefined
          ? body.medicalConditions?.trim() || undefined
          : children[childIndex].medicalConditions,
    };

    // Update the children array
    const updatedChildren = [...children];
    updatedChildren[childIndex] = updatedChild;

    await adminDb.collection("users").doc(userId).update({
      children: updatedChildren,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: updatedChild,
    });
  } catch (error) {
    console.error("Error updating child:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update child" },
      { status: 500 }
    );
  }
}

// DELETE remove a child
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyUserSession(request);

    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const { id: childId } = await params;

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

    // Find the child to delete
    const childToDelete = children.find((c) => c.id === childId);

    if (!childToDelete) {
      return NextResponse.json(
        { success: false, error: "Child not found" },
        { status: 404 }
      );
    }

    // Remove child from array
    const updatedChildren = children.filter((c) => c.id !== childId);

    await adminDb.collection("users").doc(userId).update({
      children: updatedChildren,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Child removed successfully",
    });
  } catch (error) {
    console.error("Error deleting child:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete child" },
      { status: 500 }
    );
  }
}
