import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FormTemplate, UpdateFormTemplateInput } from "@/types/form";

// GET single form template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await adminDb.collection("form_templates").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Form template not found" },
        { status: 404 }
      );
    }

    // Get response count
    const responsesSnapshot = await adminDb
      .collection("form_responses")
      .where("formId", "==", id)
      .count()
      .get();

    const formData = {
      id: doc.id,
      ...doc.data(),
      responseCount: responsesSnapshot.data().count,
    } as FormTemplate & { responseCount: number };

    return NextResponse.json({
      success: true,
      data: formData,
    });
  } catch (error) {
    console.error("Error fetching form template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch form template" },
      { status: 500 }
    );
  }
}

// PUT update form template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateFormTemplateInput = await request.json();

    const docRef = adminDb.collection("form_templates").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Form template not found" },
        { status: 404 }
      );
    }

    // Validate questions if provided
    if (body.questions) {
      const validTypes = [
        "text",
        "textarea",
        "select",
        "checkbox",
        "radio",
        "date",
        "number",
      ];

      for (const question of body.questions) {
        if (!validTypes.includes(question.type)) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid question type: ${question.type}`,
            },
            { status: 400 }
          );
        }

        if (!question.label) {
          return NextResponse.json(
            { success: false, error: "All questions must have a label" },
            { status: 400 }
          );
        }

        // Validate options for select/radio/checkbox
        if (["select", "radio", "checkbox"].includes(question.type)) {
          if (!question.options || question.options.length === 0) {
            return NextResponse.json(
              {
                success: false,
                error: `Question "${question.label}" requires options`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.questions !== undefined) updateData.questions = body.questions;
    if (body.sessionIds !== undefined) updateData.sessionIds = body.sessionIds;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
      message: "Form template updated successfully",
    });
  } catch (error) {
    console.error("Error updating form template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update form template" },
      { status: 500 }
    );
  }
}

// DELETE form template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docRef = adminDb.collection("form_templates").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Form template not found" },
        { status: 404 }
      );
    }

    // Check if there are any responses
    const responsesSnapshot = await adminDb
      .collection("form_responses")
      .where("formId", "==", id)
      .limit(1)
      .get();

    if (!responsesSnapshot.empty) {
      // Don't delete, just deactivate
      await docRef.update({
        isActive: false,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message:
          "Form template has responses and was deactivated instead of deleted",
        deactivated: true,
      });
    }

    // No responses, safe to delete
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Form template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting form template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete form template" },
      { status: 500 }
    );
  }
}
