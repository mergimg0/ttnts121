"use client";

import { useState, useCallback } from "react";
import { FormQuestion, QuestionType } from "@/types/form";
import { QuestionEditor } from "./question-editor";
import { FormPreview } from "./form-preview";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Eye,
  EyeOff,
  Type,
  AlignLeft,
  List,
  CircleDot,
  CheckSquare,
  Calendar,
  Hash,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

interface FormBuilderProps {
  questions: FormQuestion[];
  onChange: (questions: FormQuestion[]) => void;
}

const questionTypeButtons = [
  { type: "text" as QuestionType, label: "Short Text", icon: Type },
  { type: "textarea" as QuestionType, label: "Long Text", icon: AlignLeft },
  { type: "select" as QuestionType, label: "Dropdown", icon: List },
  { type: "radio" as QuestionType, label: "Single Choice", icon: CircleDot },
  { type: "checkbox" as QuestionType, label: "Multi Choice", icon: CheckSquare },
  { type: "date" as QuestionType, label: "Date", icon: Calendar },
  { type: "number" as QuestionType, label: "Number", icon: Hash },
];

export function FormBuilder({ questions, onChange }: FormBuilderProps) {
  const [showPreview, setShowPreview] = useState(false);

  const addQuestion = useCallback(
    (type: QuestionType) => {
      const needsOptions = ["select", "radio", "checkbox"].includes(type);
      const newQuestion: FormQuestion = {
        id: uuidv4(),
        type,
        label: "",
        required: false,
        order: questions.length,
        ...(needsOptions ? { options: ["Option 1", "Option 2"] } : {}),
      };
      onChange([...questions, newQuestion]);
    },
    [questions, onChange]
  );

  const updateQuestion = useCallback(
    (index: number, question: FormQuestion) => {
      const updated = [...questions];
      updated[index] = question;
      onChange(updated);
    },
    [questions, onChange]
  );

  const deleteQuestion = useCallback(
    (index: number) => {
      const updated = questions.filter((_, i) => i !== index);
      // Reorder remaining questions
      const reordered = updated.map((q, i) => ({ ...q, order: i }));
      onChange(reordered);
    },
    [questions, onChange]
  );

  const moveQuestion = useCallback(
    (index: number, direction: "up" | "down") => {
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === questions.length - 1)
      ) {
        return;
      }

      const newIndex = direction === "up" ? index - 1 : index + 1;
      const updated = [...questions];
      const [removed] = updated.splice(index, 1);
      updated.splice(newIndex, 0, removed);

      // Update order values
      const reordered = updated.map((q, i) => ({ ...q, order: i }));
      onChange(reordered);
    },
    [questions, onChange]
  );

  return (
    <div className="space-y-6">
      {/* Add Question Buttons */}
      <AdminCard hover={false}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-neutral-900">
            Add Question
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Preview
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {questionTypeButtons.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => addQuestion(type)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border border-neutral-200",
                "hover:border-sky-300 hover:bg-sky-50 transition-all",
                "text-neutral-600 hover:text-sky-600"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </AdminCard>

      {/* Questions List and Preview */}
      <div className={cn("grid gap-6", showPreview && "lg:grid-cols-2")}>
        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <AdminCard hover={false}>
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-neutral-400" />
                </div>
                <h3 className="text-sm font-medium text-neutral-900 mb-1">
                  No questions yet
                </h3>
                <p className="text-sm text-neutral-500">
                  Click a question type above to get started
                </p>
              </div>
            </AdminCard>
          ) : (
            questions
              .sort((a, b) => a.order - b.order)
              .map((question, index) => (
                <div key={question.id} className="relative">
                  {/* Reorder buttons */}
                  <div className="absolute -left-10 top-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => moveQuestion(index, "up")}
                      disabled={index === 0}
                      className={cn(
                        "p-1 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100",
                        index === 0 && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(index, "down")}
                      disabled={index === questions.length - 1}
                      className={cn(
                        "p-1 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100",
                        index === questions.length - 1 &&
                          "opacity-30 cursor-not-allowed"
                      )}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  <QuestionEditor
                    question={question}
                    onChange={(q) => updateQuestion(index, q)}
                    onDelete={() => deleteQuestion(index)}
                  />
                </div>
              ))
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && questions.length > 0 && (
          <div className="lg:sticky lg:top-4">
            <AdminCard hover={false}>
              <h3 className="text-[15px] font-semibold text-neutral-900 mb-4">
                Form Preview
              </h3>
              <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50">
                <FormPreview questions={questions} />
              </div>
            </AdminCard>
          </div>
        )}
      </div>
    </div>
  );
}
