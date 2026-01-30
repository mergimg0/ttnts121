import { adminDb } from "@/lib/firebase-admin";

/**
 * Verify that a user owns a specific resource
 */
export async function verifyResourceOwnership(
  userId: string,
  resourceType: "booking" | "child" | "user",
  resourceId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case "booking": {
        const booking = await adminDb.collection("bookings").doc(resourceId).get();
        if (!booking.exists) return false;
        return booking.data()?.userId === userId;
      }

      case "child": {
        // Children are stored as subcollection under users
        const childDoc = await adminDb
          .collection("users")
          .doc(userId)
          .collection("children")
          .doc(resourceId)
          .get();
        return childDoc.exists;
      }

      case "user": {
        // User can only access their own user document
        return resourceId === userId;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error(`IDOR check failed for ${resourceType}/${resourceId}:`, error);
    return false;
  }
}

/**
 * Get a resource only if the user owns it
 */
export async function getOwnedResource<T>(
  userId: string,
  resourceType: "booking" | "child",
  resourceId: string
): Promise<T | null> {
  try {
    switch (resourceType) {
      case "booking": {
        const booking = await adminDb.collection("bookings").doc(resourceId).get();
        if (!booking.exists) return null;
        const data = booking.data();
        if (data?.userId !== userId) return null;
        return { id: booking.id, ...data } as T;
      }

      case "child": {
        const childDoc = await adminDb
          .collection("users")
          .doc(userId)
          .collection("children")
          .doc(resourceId)
          .get();
        if (!childDoc.exists) return null;
        return { id: childDoc.id, ...childDoc.data() } as T;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to get owned ${resourceType}/${resourceId}:`, error);
    return null;
  }
}

/**
 * List resources owned by a user
 */
export async function listOwnedResources<T>(
  userId: string,
  resourceType: "bookings" | "children"
): Promise<T[]> {
  try {
    switch (resourceType) {
      case "bookings": {
        const snapshot = await adminDb
          .collection("bookings")
          .where("userId", "==", userId)
          .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
      }

      case "children": {
        const snapshot = await adminDb
          .collection("users")
          .doc(userId)
          .collection("children")
          .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
      }

      default:
        return [];
    }
  } catch (error) {
    console.error(`Failed to list ${resourceType} for user ${userId}:`, error);
    return [];
  }
}

/**
 * Validate that an ID is a valid Firestore document ID format
 * Prevents injection of path traversal or malicious IDs
 */
export function isValidDocumentId(id: string): boolean {
  if (!id || typeof id !== "string") return false;

  // Firestore document IDs:
  // - Must be 1-1500 bytes when UTF-8 encoded
  // - Cannot contain forward slash
  // - Cannot be __.*__ (reserved)
  // - Cannot be "." or ".."

  if (id.length < 1 || id.length > 1500) return false;
  if (id.includes("/")) return false;
  if (id.startsWith("__") && id.endsWith("__")) return false;
  if (id === "." || id === "..") return false;

  // Additional safety: only allow alphanumeric, dash, underscore
  return /^[a-zA-Z0-9_-]+$/.test(id);
}
