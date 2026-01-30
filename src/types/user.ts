import { Timestamp } from "firebase/firestore";

// Authorized contact for pickup/notifications
export interface AuthorizedContact {
  id: string;
  name: string;
  email?: string;
  phone: string;
  relationship: string; // e.g., "Father", "Grandmother", "Authorized Pickup"
  canPickup: boolean;
  receiveEmails: boolean;
}

// Child linked to a user account
export interface UserChild {
  id: string;
  firstName: string;
  lastName: string;
  dob: Date | Timestamp;
  medicalConditions?: string;
  // Authorized contacts for this child (secondary parents, pickup persons)
  authorizedContacts?: AuthorizedContact[];
}

// Coach permissions - controls what coaches can access in the coach portal
export interface CoachPermissions {
  canLogHours: boolean;        // Can log their own hours (default: true)
  canViewEarnings: boolean;    // Can view their earnings (default: true)
  canViewSessions: boolean;    // Can view assigned sessions (default: false)
  canViewTimetable: boolean;   // Can view timetable (default: false)
  canMarkAttendance: boolean;  // Can mark attendance (default: false)
}

// Default permissions for new/restricted coaches
export const DEFAULT_COACH_PERMISSIONS: CoachPermissions = {
  canLogHours: true,
  canViewEarnings: true,
  canViewSessions: false,
  canViewTimetable: false,
  canMarkAttendance: false,
};

// Full permissions for trusted coaches
export const FULL_COACH_PERMISSIONS: CoachPermissions = {
  canLogHours: true,
  canViewEarnings: true,
  canViewSessions: true,
  canViewTimetable: true,
  canMarkAttendance: true,
};

// User - Customer, Admin, or Coach account
export interface User {
  id: string;                    // Firebase Auth UID
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin' | 'coach';
  // Sessions assigned to this coach (only for role: 'coach')
  assignedSessions?: string[];
  // Coach permissions (only for role: 'coach')
  // If undefined, defaults to FULL_COACH_PERMISSIONS for backward compatibility
  coachPermissions?: CoachPermissions;
  // Children linked to this account
  children: UserChild[];
  // Preferences
  marketingConsent: boolean;
  emailVerified: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Form data types for creating/updating users
export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'emailVerified'>;
export type UpdateUserInput = Partial<Omit<CreateUserInput, 'email' | 'role'>>;

// Registration form data
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  marketingConsent: boolean;
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
}

// Password reset form data
export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

// Auth state for context
export interface AuthState {
  user: User | null;
  firebaseUser: import("firebase/auth").User | null;
  loading: boolean;
  error: string | null;
}

// Communication preferences for portal
export interface CommunicationPreferences {
  emailBookingConfirmations: boolean;
  emailSessionReminders: boolean;
  emailPromotions: boolean;
  smsReminders: boolean;
}

// Booking status for portal display
export type PortalBookingStatus = 'upcoming' | 'past' | 'cancelled';

// Child form data for portal
export interface ChildFormData {
  firstName: string;
  lastName: string;
  dob: string; // ISO date string for form
  medicalConditions?: string;
}

// Profile update form data
export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  communicationPreferences?: CommunicationPreferences;
}

// Password change form data
export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
