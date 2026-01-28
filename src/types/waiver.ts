import { Timestamp } from "firebase/firestore";

// Waiver Template - Created by admin
export interface WaiverTemplate {
  id: string;
  name: string;
  content: string; // HTML/markdown content
  sessionIds?: string[]; // Empty = applies to all sessions
  isRequired: boolean;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Waiver Signature - Signed by parent/guardian during checkout
export interface WaiverSignature {
  id: string;
  waiverId: string;
  waiverName: string;
  bookingId: string;
  bookingRef: string;
  childName: string;
  signatureData: string; // Base64 PNG from signature pad
  signedBy: string; // Parent/guardian name
  signedAt: Date | Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

// Input types for creating/updating
export type CreateWaiverTemplateInput = Omit<
  WaiverTemplate,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateWaiverTemplateInput = Partial<CreateWaiverTemplateInput>;

export type CreateWaiverSignatureInput = Omit<
  WaiverSignature,
  "id" | "signedAt"
>;

// API response for waiver with signature status
export interface WaiverWithStatus extends WaiverTemplate {
  isSigned: boolean;
  signature?: WaiverSignature;
}
