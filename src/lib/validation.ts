// Form validation utilities

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// UK phone number validation (flexible)
export function isValidPhone(phone: string): boolean {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  // UK numbers are typically 10-11 digits
  return cleaned.length >= 10 && cleaned.length <= 13;
}

// Date validation (check if date is in the past and reasonable for a child)
export function isValidChildDOB(dob: string): { valid: boolean; error?: string } {
  const date = new Date(dob);
  const today = new Date();
  const minAge = 3; // Minimum age
  const maxAge = 14; // Maximum age

  if (isNaN(date.getTime())) {
    return { valid: false, error: "Please enter a valid date" };
  }

  const age = Math.floor(
    (today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  if (age < minAge) {
    return { valid: false, error: `Child must be at least ${minAge} years old` };
  }

  if (age > maxAge) {
    return { valid: false, error: `Child must be ${maxAge} years old or younger` };
  }

  return { valid: true };
}

// Generic required field check
export function isRequired(value: string, fieldName: string): ValidationError | null {
  if (!value || value.trim() === "") {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

// Checkout form validation
export interface CheckoutFormData {
  childFirstName: string;
  childLastName: string;
  childDOB: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  medicalConditions: string;
}

export function validateCheckoutForm(data: CheckoutFormData): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.childFirstName.trim()) {
    errors.push({ field: "childFirstName", message: "Child's first name is required" });
  }
  if (!data.childLastName.trim()) {
    errors.push({ field: "childLastName", message: "Child's last name is required" });
  }
  if (!data.childDOB) {
    errors.push({ field: "childDOB", message: "Child's date of birth is required" });
  } else {
    const dobCheck = isValidChildDOB(data.childDOB);
    if (!dobCheck.valid) {
      errors.push({ field: "childDOB", message: dobCheck.error || "Invalid date of birth" });
    }
  }

  if (!data.parentFirstName.trim()) {
    errors.push({ field: "parentFirstName", message: "Your first name is required" });
  }
  if (!data.parentLastName.trim()) {
    errors.push({ field: "parentLastName", message: "Your last name is required" });
  }
  if (!data.parentEmail.trim()) {
    errors.push({ field: "parentEmail", message: "Email is required" });
  } else if (!isValidEmail(data.parentEmail)) {
    errors.push({ field: "parentEmail", message: "Please enter a valid email address" });
  }
  if (!data.parentPhone.trim()) {
    errors.push({ field: "parentPhone", message: "Phone number is required" });
  } else if (!isValidPhone(data.parentPhone)) {
    errors.push({ field: "parentPhone", message: "Please enter a valid phone number" });
  }

  // Emergency contact
  if (!data.emergencyContactName.trim()) {
    errors.push({ field: "emergencyContactName", message: "Emergency contact name is required" });
  }
  if (!data.emergencyContactPhone.trim()) {
    errors.push({ field: "emergencyContactPhone", message: "Emergency contact phone is required" });
  } else if (!isValidPhone(data.emergencyContactPhone)) {
    errors.push({ field: "emergencyContactPhone", message: "Please enter a valid phone number" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Waitlist form validation
export interface WaitlistFormData {
  childFirstName: string;
  childLastName: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone?: string;
}

export function validateWaitlistForm(data: WaitlistFormData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.childFirstName.trim()) {
    errors.push({ field: "childFirstName", message: "Child's first name is required" });
  }
  if (!data.childLastName.trim()) {
    errors.push({ field: "childLastName", message: "Child's last name is required" });
  }
  if (!data.parentFirstName.trim()) {
    errors.push({ field: "parentFirstName", message: "Your first name is required" });
  }
  if (!data.parentLastName.trim()) {
    errors.push({ field: "parentLastName", message: "Your last name is required" });
  }
  if (!data.parentEmail.trim()) {
    errors.push({ field: "parentEmail", message: "Email is required" });
  } else if (!isValidEmail(data.parentEmail)) {
    errors.push({ field: "parentEmail", message: "Please enter a valid email address" });
  }
  if (data.parentPhone && !isValidPhone(data.parentPhone)) {
    errors.push({ field: "parentPhone", message: "Please enter a valid phone number" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Birthday inquiry form validation
export interface BirthdayFormData {
  parentName: string;
  email: string;
  phone: string;
  childName: string;
  childAge: string;
  partyDate: string;
  venueType: string;
  guestCount: string;
}

export function validateBirthdayForm(data: BirthdayFormData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.parentName.trim()) {
    errors.push({ field: "parentName", message: "Your name is required" });
  }
  if (!data.email.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: "email", message: "Please enter a valid email address" });
  }
  if (!data.phone.trim()) {
    errors.push({ field: "phone", message: "Phone number is required" });
  } else if (!isValidPhone(data.phone)) {
    errors.push({ field: "phone", message: "Please enter a valid phone number" });
  }
  if (!data.childName.trim()) {
    errors.push({ field: "childName", message: "Child's name is required" });
  }
  if (!data.childAge) {
    errors.push({ field: "childAge", message: "Child's age is required" });
  } else {
    const age = parseInt(data.childAge);
    if (isNaN(age) || age < 4 || age > 12) {
      errors.push({ field: "childAge", message: "Age must be between 4 and 12" });
    }
  }
  if (!data.partyDate) {
    errors.push({ field: "partyDate", message: "Party date is required" });
  } else {
    const date = new Date(data.partyDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      errors.push({ field: "partyDate", message: "Party date must be in the future" });
    }
  }
  if (!data.venueType) {
    errors.push({ field: "venueType", message: "Please select a venue type" });
  }
  if (!data.guestCount) {
    errors.push({ field: "guestCount", message: "Number of guests is required" });
  } else {
    const count = parseInt(data.guestCount);
    if (isNaN(count) || count < 8 || count > 20) {
      errors.push({ field: "guestCount", message: "Guest count must be between 8 and 20" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Helper to get error for a specific field
export function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}
