"use client";

import { FormQuestion } from "@/types/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormPreviewProps {
  questions: FormQuestion[];
  className?: string;
}

export function FormPreview({ questions, className }: FormPreviewProps) {
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  const renderField = (question: FormQuestion) => {
    const { type, label, placeholder, required, options, helpText } = question;

    switch (type) {
      case "text":
        return (
          <Input
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            disabled
            className="bg-white"
          />
        );

      case "textarea":
        return (
          <Textarea
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            disabled
            className="bg-white min-h-[100px]"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={placeholder || "Enter a number"}
            disabled
            className="bg-white"
          />
        );

      case "date":
        return (
          <Input
            type="date"
            disabled
            className="bg-white"
          />
        );

      case "select":
        return (
          <select
            disabled
            className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-500"
          >
            <option value="">{placeholder || "Select an option"}</option>
            {options?.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {options?.map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-3 cursor-not-allowed"
              >
                <input
                  type="radio"
                  name={question.id}
                  disabled
                  className="h-4 w-4 border-neutral-300 text-sky-600"
                />
                <span className="text-sm text-neutral-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {options?.map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-3 cursor-not-allowed"
              >
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 rounded border-neutral-300 text-sky-600"
                />
                <span className="text-sm text-neutral-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (sortedQuestions.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No questions to preview
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {sortedQuestions.map((question) => (
        <div key={question.id} className="space-y-2">
          <label className="block text-sm font-medium text-neutral-900">
            {question.label || "Untitled Question"}
            {question.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          {renderField(question)}
          {question.helpText && (
            <p className="text-xs text-neutral-500">{question.helpText}</p>
          )}
        </div>
      ))}
    </div>
  );
}
