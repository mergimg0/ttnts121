import { Timestamp } from "firebase/firestore";

// Program - A category of sessions (e.g., "After School Club - Spring 2024")
export interface Program {
  id: string;
  name: string;
  description: string;
  location: string;
  serviceType: "after-school" | "group-session" | "half-term" | "one-to-one" | "birthday-party";
  dateRange: {
    start: Date | Timestamp;
    end: Date | Timestamp;
  };
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Session - Individual bookable time slot within a program
export interface Session {
  id: string;
  programId: string;
  name: string;
  description: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "15:30"
  endTime: string; // "16:30"
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  location: string;
  ageMin: number;
  ageMax: number;
  price: number; // in pence
  capacity: number;
  enrolled: number;
  waitlistEnabled: boolean;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Booking - A parent's registration for a session
export interface Booking {
  id: string;
  sessionId: string;
  sessionIds?: string[]; // For multi-session bookings
  programId?: string;
  // Child info
  childFirstName: string;
  childLastName: string;
  childDOB: Date | Timestamp;
  ageGroup: string;
  medicalConditions?: string;
  // Parent info
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
  };
  // Payment
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  amount: number; // in pence
  // Consent
  photoConsent?: boolean;
  termsAccepted?: boolean;
  marketingConsent?: boolean;
  // Metadata
  bookingRef: string;
  status?: "confirmed" | "cancelled" | "waitlist";
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Waitlist entry
export interface WaitlistEntry {
  id: string;
  sessionId: string;
  // Child info
  childFirstName: string;
  childLastName: string;
  ageGroup: string;
  // Parent info
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone?: string;
  // Status
  position?: number;
  notifiedAt?: Date | Timestamp;
  expiresAt?: Date | Timestamp;
  status: "waiting" | "notified" | "expired" | "converted";
  createdAt: Date | Timestamp;
}

// Cart item for frontend state
export interface CartItem {
  sessionId: string;
  sessionName: string;
  programId: string;
  programName: string;
  price: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  ageMin: number;
  ageMax: number;
  addedAt: Date;
}

// Admin user
export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: "admin" | "super-admin";
  createdAt: Date | Timestamp;
}

// Form data types for creating/updating
export type CreateProgramInput = Omit<Program, "id" | "createdAt" | "updatedAt">;
export type UpdateProgramInput = Partial<CreateProgramInput>;

export type CreateSessionInput = Omit<Session, "id" | "enrolled" | "createdAt" | "updatedAt">;
export type UpdateSessionInput = Partial<CreateSessionInput>;

export type CreateBookingInput = Omit<
  Booking,
  "id" | "bookingRef" | "status" | "paymentStatus" | "createdAt" | "updatedAt"
>;

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Filter types for sessions
export interface SessionFilters {
  location?: string;
  ageGroup?: string;
  dateFrom?: string;
  dateTo?: string;
  timeOfDay?: "morning" | "afternoon" | "evening";
  serviceType?: string;
}

// Stats for admin dashboard
export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  upcomingSessions: number;
  waitlistCount: number;
  recentBookings: Booking[];
}
