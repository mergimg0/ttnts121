import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { User, UserChild, AuthorizedContact } from "@/types/user";
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

// POST - Add a new authorized contact
export async function POST(
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

    // Validate required fields
    if (!body.name?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name and phone are required" },
        { status: 400 }
      );
    }

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
    const childIndex = children.findIndex((c) => c.id === childId);

    if (childIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Child not found" },
        { status: 404 }
      );
    }

    // Create new contact
    const newContact: AuthorizedContact = {
      id: uuidv4(),
      name: body.name.trim(),
      email: body.email?.trim() || undefined,
      phone: body.phone.trim(),
      relationship: body.relationship?.trim() || "Other",
      canPickup: body.canPickup ?? true,
      receiveEmails: body.receiveEmails ?? true,
    };

    // Update child's authorized contacts
    const updatedChild: UserChild = {
      ...children[childIndex],
      authorizedContacts: [
        ...(children[childIndex].authorizedContacts || []),
        newContact,
      ],
    };

    // Update the children array
    const updatedChildren = [...children];
    updatedChildren[childIndex] = updatedChild;

    await adminDb.collection("users").doc(userId).update({
      children: updatedChildren,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: newContact,
    });
  } catch (error) {
    console.error("Error adding contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add contact" },
      { status: 500 }
    );
  }
}

// PUT - Update an authorized contact
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

    if (!body.contactId) {
      return NextResponse.json(
        { success: false, error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name and phone are required" },
        { status: 400 }
      );
    }

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
    const childIndex = children.findIndex((c) => c.id === childId);

    if (childIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Child not found" },
        { status: 404 }
      );
    }

    const contacts = children[childIndex].authorizedContacts || [];
    const contactIndex = contacts.findIndex((c) => c.id === body.contactId);

    if (contactIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    // Update contact
    const updatedContact: AuthorizedContact = {
      ...contacts[contactIndex],
      name: body.name.trim(),
      email: body.email?.trim() || undefined,
      phone: body.phone.trim(),
      relationship: body.relationship?.trim() || "Other",
      canPickup: body.canPickup ?? contacts[contactIndex].canPickup,
      receiveEmails: body.receiveEmails ?? contacts[contactIndex].receiveEmails,
    };

    // Update the contacts array
    const updatedContacts = [...contacts];
    updatedContacts[contactIndex] = updatedContact;

    // Update child
    const updatedChild: UserChild = {
      ...children[childIndex],
      authorizedContacts: updatedContacts,
    };

    // Update the children array
    const updatedChildren = [...children];
    updatedChildren[childIndex] = updatedChild;

    await adminDb.collection("users").doc(userId).update({
      children: updatedChildren,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: updatedContact,
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an authorized contact
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
    const body = await request.json();

    if (!body.contactId) {
      return NextResponse.json(
        { success: false, error: "Contact ID is required" },
        { status: 400 }
      );
    }

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
    const childIndex = children.findIndex((c) => c.id === childId);

    if (childIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Child not found" },
        { status: 404 }
      );
    }

    const contacts = children[childIndex].authorizedContacts || [];
    const updatedContacts = contacts.filter((c) => c.id !== body.contactId);

    if (contacts.length === updatedContacts.length) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    // Update child
    const updatedChild: UserChild = {
      ...children[childIndex],
      authorizedContacts: updatedContacts,
    };

    // Update the children array
    const updatedChildren = [...children];
    updatedChildren[childIndex] = updatedChild;

    await adminDb.collection("users").doc(userId).update({
      children: updatedChildren,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Contact removed successfully",
    });
  } catch (error) {
    console.error("Error removing contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove contact" },
      { status: 500 }
    );
  }
}
