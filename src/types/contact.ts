import { Timestamp } from "firebase/firestore";

// Contact - Email subscriber for campaigns
export interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string; // From LOCATIONS constant
  marketingConsent: boolean;
  consentTimestamp?: Date | Timestamp;
  source: "booking" | "waitlist" | "manual" | "import";
  tags?: string[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Consent change log
export interface ConsentLog {
  id: string;
  contactId: string;
  action: "granted" | "revoked";
  timestamp: Date | Timestamp;
  method: "form" | "admin" | "import" | "booking";
  ipAddress?: string;
}

// Campaign for email marketing
export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML content
  status: "draft" | "sending" | "sent" | "failed";
  // Targeting
  targetType: "all" | "location" | "custom";
  targetLocations?: string[]; // If targetType === "location"
  targetContactIds?: string[]; // If targetType === "custom"
  // Stats
  recipientCount: number;
  sentCount?: number;
  failedCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  bouncedCount?: number;
  sentAt?: Date | Timestamp;
  error?: string | null;
  // Resend tracking
  resendEmailIds?: string[];
  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  createdBy: string; // Admin uid
}

// Form data types
export type CreateContactInput = Omit<Contact, "id" | "createdAt" | "updatedAt">;
export type UpdateContactInput = Partial<CreateContactInput>;

export type CreateCampaignInput = Omit<
  Campaign,
  "id" | "status" | "sentCount" | "failedCount" | "deliveredCount" | "openedCount" | "clickedCount" | "bouncedCount" | "sentAt" | "error" | "resendEmailIds" | "createdAt" | "updatedAt"
>;
export type UpdateCampaignInput = Partial<CreateCampaignInput>;

// API response with pagination
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Contact filters
export interface ContactFilters {
  search?: string;
  location?: string;
  marketingConsent?: boolean;
  source?: Contact["source"];
}

// Campaign stats from Resend
export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}
