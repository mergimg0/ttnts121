/**
 * GDS Data Cleanup Script
 *
 * This script fixes data issues in the gds_students collection:
 * 1. Removes duplicate records (same studentName + day + ageGroup)
 * 2. Normalizes age group values (e.g., "Y1 - Y2" -> "Y1-Y2")
 *
 * Run with: npx tsx scripts/fix-gds-data.ts [--dry-run]
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

// Initialize Firebase Admin
function initFirebase() {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  const app = initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });

  return getFirestore(app);
}

// Age group mapping for normalization
const AGE_GROUP_MAPPING: Record<string, string> = {
  "Y1 - Y2": "Y1-Y2",
  "Y3 - Y4": "Y3-Y4",
  "Y5 - Y6": "Y5-Y6",
  "Y6 - Y7": "Y6-Y7",
  GDS: "Y3-Y4", // Default unknown "GDS" to Y3-Y4
};

interface GDSStudentDoc {
  id: string;
  studentName: string;
  day: string;
  ageGroup: string;
  status: string;
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("=== GDS Data Cleanup Script ===");
  console.log(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "LIVE"}`);
  console.log("");

  const db = initFirebase();

  // Fetch all GDS students
  const snapshot = await db.collection("gds_students").get();
  const students: GDSStudentDoc[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    studentName: doc.data().studentName,
    day: doc.data().day,
    ageGroup: doc.data().ageGroup,
    status: doc.data().status,
  }));

  console.log(`Total records found: ${students.length}`);
  console.log("");

  // === Step 1: Find and remove duplicates ===
  console.log("--- Step 1: Finding duplicates ---");

  const seen = new Map<string, string>(); // key -> first docId
  const duplicates: string[] = [];

  students.forEach((student) => {
    const key = `${student.studentName}|${student.day}|${student.ageGroup}`;
    if (seen.has(key)) {
      duplicates.push(student.id);
    } else {
      seen.set(key, student.id);
    }
  });

  console.log(`Duplicate records found: ${duplicates.length}`);

  if (duplicates.length > 0) {
    console.log("Duplicates to delete:");
    duplicates.slice(0, 10).forEach((id) => {
      const student = students.find((s) => s.id === id);
      console.log(`  - ${student?.studentName} (${student?.day}, ${student?.ageGroup})`);
    });
    if (duplicates.length > 10) {
      console.log(`  ... and ${duplicates.length - 10} more`);
    }

    if (!isDryRun) {
      console.log("Deleting duplicates...");
      let deleted = 0;

      // Delete in batches of 500
      for (let i = 0; i < duplicates.length; i += 500) {
        const batch = db.batch();
        const chunk = duplicates.slice(i, i + 500);

        for (const id of chunk) {
          batch.delete(db.collection("gds_students").doc(id));
        }

        await batch.commit();
        deleted += chunk.length;
        console.log(`  Deleted ${deleted}/${duplicates.length} records`);
      }

      console.log(`✓ Deleted ${duplicates.length} duplicate records`);
    }
  }

  console.log("");

  // === Step 2: Normalize age group values ===
  console.log("--- Step 2: Normalizing age group values ---");

  const toUpdate: { id: string; oldValue: string; newValue: string }[] = [];

  students.forEach((student) => {
    if (duplicates.includes(student.id)) return; // Skip duplicates

    const mapped = AGE_GROUP_MAPPING[student.ageGroup];
    if (mapped) {
      toUpdate.push({
        id: student.id,
        oldValue: student.ageGroup,
        newValue: mapped,
      });
    }
  });

  console.log(`Records needing age group update: ${toUpdate.length}`);

  if (toUpdate.length > 0) {
    // Show breakdown
    const breakdown = new Map<string, number>();
    toUpdate.forEach(({ oldValue, newValue }) => {
      const key = `"${oldValue}" -> "${newValue}"`;
      breakdown.set(key, (breakdown.get(key) || 0) + 1);
    });

    console.log("Changes to make:");
    breakdown.forEach((count, change) => {
      console.log(`  ${change}: ${count} records`);
    });

    if (!isDryRun) {
      console.log("Updating age groups...");
      let updated = 0;

      // Update in batches of 500
      for (let i = 0; i < toUpdate.length; i += 500) {
        const batch = db.batch();
        const chunk = toUpdate.slice(i, i + 500);

        for (const update of chunk) {
          batch.update(db.collection("gds_students").doc(update.id), {
            ageGroup: update.newValue,
            updatedAt: new Date(),
          });
        }

        await batch.commit();
        updated += chunk.length;
        console.log(`  Updated ${updated}/${toUpdate.length} records`);
      }

      console.log(`✓ Updated ${toUpdate.length} age group values`);
    }
  }

  console.log("");

  // === Summary ===
  console.log("=== Summary ===");
  console.log(`Original records: ${students.length}`);
  console.log(`Duplicates removed: ${isDryRun ? `${duplicates.length} (would be)` : duplicates.length}`);
  console.log(`Age groups normalized: ${isDryRun ? `${toUpdate.length} (would be)` : toUpdate.length}`);
  console.log(`Final record count: ${isDryRun ? `${students.length - duplicates.length} (estimated)` : students.length - duplicates.length}`);

  if (isDryRun) {
    console.log("");
    console.log("This was a dry run. Run without --dry-run to apply changes.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
