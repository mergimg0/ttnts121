import {
  Award,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  FileEdit,
  FileText,
  Grid3X3,
  LayoutDashboard,
  Link2,
  LucideIcon,
  Mail,
  Package,
  Percent,
  PiggyBank,
  Settings,
  ShoppingCart,
  Tag,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

// ============================================================================
// Type Definitions
// ============================================================================

export type AdminTab =
  | "overview"
  | "operations"
  | "finance"
  | "marketing"
  | "settings";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string; // Empty string for no header
  items: NavItem[];
}

export interface TabConfig {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
  groups: NavGroup[];
}

// ============================================================================
// Navigation Configuration
// ============================================================================

export const adminTabs: TabConfig[] = [
  // Tab 1: Overview
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    groups: [
      {
        title: "",
        items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
      },
    ],
  },

  // Tab 2: Operations
  {
    id: "operations",
    label: "Operations",
    icon: ClipboardList,
    groups: [
      {
        title: "BOOKINGS",
        items: [
          { label: "All Bookings", href: "/admin/bookings", icon: CreditCard },
          {
            label: "Block Bookings",
            href: "/admin/block-bookings",
            icon: Package,
          },
          { label: "Waitlist", href: "/admin/waitlist", icon: Users },
        ],
      },
      {
        title: "SCHEDULE",
        items: [
          { label: "Timetable", href: "/admin/timetable", icon: Grid3X3 },
          { label: "Sessions", href: "/admin/sessions", icon: ClipboardList },
          {
            label: "Attendance",
            href: "/admin/attendance",
            icon: ClipboardCheck,
          },
        ],
      },
      {
        title: "PROGRAMS",
        items: [
          { label: "All Programs", href: "/admin/programs", icon: Calendar },
          { label: "GDS", href: "/admin/gds", icon: UsersRound },
          { label: "Challenges", href: "/admin/challenges", icon: Trophy },
        ],
      },
    ],
  },

  // Tab 3: Finance
  {
    id: "finance",
    label: "Finance",
    icon: PiggyBank,
    groups: [
      {
        title: "OVERVIEW",
        items: [
          {
            label: "Finance Dashboard",
            href: "/admin/finance",
            icon: PiggyBank,
          },
        ],
      },
      {
        title: "TRANSACTIONS",
        items: [
          { label: "Payments", href: "/admin/payments", icon: DollarSign },
          { label: "Payment Links", href: "/admin/payment-links", icon: Link2 },
          {
            label: "Abandoned Carts",
            href: "/admin/abandoned-carts",
            icon: ShoppingCart,
          },
        ],
      },
      {
        title: "PRICING",
        items: [
          { label: "Coupons", href: "/admin/coupons", icon: Tag },
          { label: "Discounts", href: "/admin/discounts", icon: Percent },
          {
            label: "Payment Plans",
            href: "/admin/payment-plans",
            icon: Wallet,
          },
        ],
      },
    ],
  },

  // Tab 4: Marketing
  {
    id: "marketing",
    label: "Marketing",
    icon: Mail,
    groups: [
      {
        title: "CUSTOMERS",
        items: [
          { label: "Contacts", href: "/admin/contacts", icon: UserPlus },
          { label: "Retention", href: "/admin/retention", icon: UserMinus },
        ],
      },
      {
        title: "OUTREACH",
        items: [{ label: "Campaigns", href: "/admin/campaigns", icon: Mail }],
      },
    ],
  },

  // Tab 5: Settings
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    groups: [
      {
        title: "TEAM",
        items: [
          { label: "Coaches", href: "/admin/coaches", icon: Users },
          { label: "Coach Hours", href: "/admin/coach-hours", icon: Clock },
          { label: "Coach Awards", href: "/admin/coach-awards", icon: Award },
        ],
      },
      {
        title: "CONFIGURATION",
        items: [
          {
            label: "Session Options",
            href: "/admin/session-options",
            icon: Settings,
          },
          { label: "Waivers", href: "/admin/waivers", icon: FileText },
          { label: "Forms", href: "/admin/forms", icon: FileEdit },
        ],
      },
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine which tab a pathname belongs to.
 * Handles nested routes like /admin/bookings/[id]
 */
export function getTabFromPath(pathname: string): AdminTab {
  // Exact match for dashboard
  if (pathname === "/admin" || pathname === "/admin/") {
    return "overview";
  }

  // Check each tab's routes
  for (const tab of adminTabs) {
    for (const group of tab.groups) {
      for (const item of group.items) {
        // Skip the dashboard since we handled it above
        if (item.href === "/admin") continue;

        // Check if pathname starts with this route
        if (pathname.startsWith(item.href)) {
          return tab.id;
        }
      }
    }
  }

  // Default to overview
  return "overview";
}

/**
 * Get flat list of all nav items across all tabs
 */
export function getAllNavItems(): NavItem[] {
  const items: NavItem[] = [];
  for (const tab of adminTabs) {
    for (const group of tab.groups) {
      items.push(...group.items);
    }
  }
  return items;
}

/**
 * Get a specific tab configuration by ID
 */
export function getTabConfig(tabId: AdminTab): TabConfig | undefined {
  return adminTabs.find((tab) => tab.id === tabId);
}

// ============================================================================
// Exported Icons (for consistent imports elsewhere)
// ============================================================================

export const AdminIcons = {
  // Overview
  LayoutDashboard,

  // Operations - Bookings
  CreditCard,
  Package,
  Users,

  // Operations - Schedule
  Grid3X3,
  ClipboardList,
  ClipboardCheck,

  // Operations - Programs
  Calendar,
  UsersRound,
  Trophy,

  // Finance - Overview
  PiggyBank,

  // Finance - Transactions
  DollarSign,
  Link2,
  ShoppingCart,

  // Finance - Pricing
  Tag,
  Percent,
  Wallet,

  // Marketing - Customers
  UserPlus,
  UserMinus,

  // Marketing - Outreach
  Mail,

  // Settings - Team
  Clock,
  Award,

  // Settings - Configuration
  Settings,
  FileText,
  FileEdit,
} as const;
