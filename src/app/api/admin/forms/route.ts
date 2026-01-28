import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  FormTemplate,
  FormQuestion,
  CreateFormTemplateInput,
} from "@/types/form";
import { v4 as uuidv4 } from "uuid";

// GET list form templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const sessionId = searchParams.get("sessionId");

    let query = adminDb
      .collection("form_templates")
      .orderBy("createdAt", "desc");

    const snapshot = await query.get();

    let forms = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FormTemplate[];

    // Filter by active status if requested
    if (activeOnly) {
      forms = forms.filter((form) => form.isActive);
    }

    // Filter by session ID if requested
    if (sessionId) {
      forms = forms.filter(
        (form) =>
          !form.sessionIds ||
          form.sessionIds.length === 0 ||
          form.sessionIds.includes(sessionId)
      );
    }

    // Get response counts for each form
    const formsWithStats = await Promise.all(
      forms.map(async (form) => {
        const responsesSnapshot = await adminDb
          .collection("form_responses")
          .where("formId", "==", form.id)
          .count()
          .get();

        return {
          ...form,
          responseCount: responsesSnapshot.data().count,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: formsWithStats,
    });
  } catch (error) {
    console.error("Error fetching form templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch form templates" },
      { status: 500 }
    );
  }
}

// POST create new form template
export async function POST(request: NextRequest) {
  try {
    const body: CreateFormTemplateInput = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Form name is required" },
        { status: 400 }
      );
    }

    if (!body.questions || body.questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one question is required" },
        { status: 400 }
      );
    }

    // Process questions - add IDs and order
    const questions: FormQuestion[] = body.questions.map((q, index) => ({
      ...q,
      id: uuidv4(),
      order: index,
    }));

    // Validate question types
    const validTypes = [
      "text",
      "textarea",
      "select",
      "checkbox",
      "radio",
      "date",
      "number",
    ];
    for (const question of questions) {
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

    const formData = {
      name: body.name,
      description: body.description || "",
      questions,
      sessionIds: body.sessionIds || [],
      isActive: body.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("form_templates").add(formData);

    // Verify write
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Failed to verify form creation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...verifyDoc.data() },
      message: "Form template created successfully",
    });
  } catch (error) {
    console.error("Error creating form template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create form template" },
      { status: 500 }
    );
  }
}
