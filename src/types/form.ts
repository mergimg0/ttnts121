import { Timestamp } from "firebase/firestore";

// Question types supported by the form builder
export type QuestionType =
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "number";

// Validation rules for form questions
export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string; // Regex pattern for custom validation
}

// Individual form question
export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select/radio/checkbox types
  validation?: QuestionValidation;
  helpText?: string; // Optional help text shown below the field
  order: number; // For drag-and-drop reordering
}

// Form template that can be assigned to sessions
export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  questions: FormQuestion[];
  sessionIds?: string[]; // Empty or undefined = applies to all sessions
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy?: string;
}

// Response submitted by a customer during checkout
export interface FormResponse {
  id: string;
  formId: string;
  formName: string; // Denormalized for quick display
  bookingId: string;
  bookingRef?: string; // Denormalized for quick lookup
  childName: string;
  answers: Record<string, unknown>; // Question ID -> answer value
  submittedAt: Date | Timestamp;
}

// Input type for creating a new form template
export interface CreateFormTemplateInput {
  name: string;
  description?: string;
  questions: Omit<FormQuestion, "id" | "order">[];
  sessionIds?: string[];
  isActive?: boolean;
}

// Input type for updating a form template
export interface UpdateFormTemplateInput {
  name?: string;
  description?: string;
  questions?: FormQuestion[];
  sessionIds?: string[];
  isActive?: boolean;
}

// Input type for submitting a form response
export interface SubmitFormResponseInput {
  formId: string;
  bookingId: string;
  childName: string;
  answers: Record<string, unknown>;
}

// Utility type for form field values
export type FormFieldValue =
  | string
  | number
  | boolean
  | string[]
  | Date
  | null;

// Form with response count for admin list view
export interface FormTemplateWithStats extends FormTemplate {
  responseCount: number;
  lastResponseAt?: Date | Timestamp;
}
