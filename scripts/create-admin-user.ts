import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey,
  }),
});

const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  const email = "admin@ttnts121.com";
  const password = "Admin123!";

  try {
    // Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: true,
      displayName: "Admin",
    });

    console.log("Successfully created user:", userRecord.uid);

    // Add admin role to Firestore
    await db.collection("admins").doc(userRecord.uid).set({
      email,
      role: "admin",
      createdAt: new Date(),
    });

    console.log("Added admin role to Firestore");
    console.log("\n=== ADMIN CREDENTIALS ===");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("=========================\n");

    process.exit(0);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string; message: string };
      if (firebaseError.code === "auth/email-already-exists") {
        console.log("User already exists. Retrieving existing user...");
        const existingUser = await auth.getUserByEmail(email);
        console.log("\n=== EXISTING ADMIN ===");
        console.log(`Email: ${email}`);
        console.log(`UID: ${existingUser.uid}`);
        console.log("Password: (use the password you set previously, or reset it)");
        console.log("======================\n");
        process.exit(0);
      }
    }
    console.error("Error creating user:", error);
    process.exit(1);
  }
}

createAdminUser();
