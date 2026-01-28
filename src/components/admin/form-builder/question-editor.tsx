"use client";

import { useState } from "react";
import { FormQuestion, QuestionType } from "@/types/form";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionEditorProps {
  question: FormQuestion;
  onChange: (question: FormQuestion) => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
}

const questionTypeOptions = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Single Choice" },
  { value: "checkbox", label: "Multiple Choice" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
];

export function QuestionEditor({
  question,
  onChange,
  onDelete,
  dragHandleProps,
}: QuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newOption, setNewOption] = useState("");

  const needsOptions = ["select", "radio", "checkbox"].includes(question.type);

  const handleChange = (field: keyof FormQuestion, value: unknown) => {
    onChange({ ...question, [field]: value });
  };

  const handleTypeChange = (type: QuestionType) => {
    const updated = { ...question, type };
    // Clear options if switching to a type that doesn't need them
    if (!["select", "radio", "checkbox"].includes(type)) {
      updated.options = undefined;
    } else if (!updated.options) {
      // Initialize options if switching to a type that needs them
      updated.options = ["Option 1"];
    }
    onChange(updated);
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    const options = question.options || [];
    onChange({ ...question, options: [...options, newOption.trim()] });
    setNewOption("");
  };

  const removeOption = (index: number) => {
    const options = question.options || [];
    onChange({
      ...question,
      options: options.filter((_, i) => i !== index),
    });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(question.options || [])];
    options[index] = value;
    onChange({ ...question, options });
  };

  return (
    <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <button
          type="button"
          className="cursor-grab text-neutral-400 hover:text-neutral-600 touch-none"
          {...dragHandleProps}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {question.label || "Untitled Question"}
          </p>
          <p className="text-xs text-neutral-500">
            {questionTypeOptions.find((t) => t.value === question.type)?.label}
            {question.required && " - Required"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminInput
              label="Question Label"
              value={question.label}
              onChange={(e) => handleChange("label", e.target.value)}
              placeholder="Enter question text"
            />

            <AdminSelect
              label="Question Type"
              value={question.type}
              onChange={(e) =>
                handleTypeChange(e.target.value as QuestionType)
              }
              options={questionTypeOptions}
            />
          </div>

          <AdminInput
            label="Placeholder Text"
            value={question.placeholder || ""}
            onChange={(e) => handleChange("placeholder", e.target.value)}
            placeholder="Optional placeholder"
          />

          <AdminInput
            label="Help Text"
            value={question.helpText || ""}
            onChange={(e) => handleChange("helpText", e.target.value)}
            placeholder="Optional help text shown below the field"
          />

          {/* Options for select/radio/checkbox */}
          {needsOptions && (
            <div className="space-y-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Options
              </label>

              <div className="space-y-2">
                {(question.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <AdminInput
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      disabled={(question.options?.length || 0) <= 1}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <AdminInput
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add new option"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={!newOption.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Validation for number type */}
          {question.type === "number" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminInput
                label="Minimum Value"
                type="number"
                value={question.validation?.min ?? ""}
                onChange={(e) =>
                  handleChange("validation", {
                    ...question.validation,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="No minimum"
              />
              <AdminInput
                label="Maximum Value"
                type="number"
                value={question.validation?.max ?? ""}
                onChange={(e) =>
                  handleChange("validation", {
                    ...question.validation,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="No maximum"
              />
            </div>
          )}

          {/* Validation for text types */}
          {["text", "textarea"].includes(question.type) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminInput
                label="Min Length"
                type="number"
                value={question.validation?.minLength ?? ""}
                onChange={(e) =>
                  handleChange("validation", {
                    ...question.validation,
                    minLength: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="No minimum"
              />
              <AdminInput
                label="Max Length"
                type="number"
                value={question.validation?.maxLength ?? ""}
                onChange={(e) =>
                  handleChange("validation", {
                    ...question.validation,
                    maxLength: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="No maximum"
              />
            </div>
          )}

          {/* Required toggle */}
          <div className="flex items-center gap-3 pt-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => handleChange("required", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
            <span className="text-sm text-neutral-700">Required field</span>
          </div>
        </div>
      )}
    </div>
  );
}
