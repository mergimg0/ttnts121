import { Timestamp } from "firebase/firestore";

/**
 * Session Option - Add-on items that can be purchased with a session booking
 * Examples: Equipment hire, extra coaching, meal packages
 */
export interface SessionOption {
  id: string;
  name: string;
  description?: string;
  /** Price in pence */
  price: number;
  /** If empty/undefined, applies to all sessions */
  sessionIds?: string[];
  /** Maximum quantity per booking (default: 1) */
  maxQuantity?: number;
  /** Whether this option must be selected */
  isRequired: boolean;
  /** Whether this option is available for purchase */
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * Booking Option - A selected option attached to a booking
 */
export interface BookingOption {
  optionId: string;
  optionName: string;
  quantity: number;
  /** Price per unit in pence */
  unitPrice: number;
  /** Total price in pence (quantity * unitPrice) */
  totalPrice: number;
}

/**
 * Cart Option - Selected option in the cart state
 */
export interface CartSessionOption {
  sessionId: string;
  optionId: string;
  optionName: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Input for creating a new session option
 */
export type CreateSessionOptionInput = Omit<
  SessionOption,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * Input for updating an existing session option
 */
export type UpdateSessionOptionInput = Partial<CreateSessionOptionInput>;
