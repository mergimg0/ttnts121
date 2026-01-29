"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  adminTabs,
  getTabFromPath,
  AdminTab,
  TabConfig,
} from "@/lib/admin-navigation";

interface AdminTabsProps {
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

/**
 * Get the default (first) route for a given tab
 */
function getDefaultRouteForTab(tab: TabConfig): string {
  // Return the first item's href from the first group
  if (tab.groups.length > 0 && tab.groups[0].items.length > 0) {
    return tab.groups[0].items[0].href;
  }
  return "/admin";
}

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  const pathname = usePathname();

  // Determine active tab from pathname if not provided
  const currentTab = activeTab ?? getTabFromPath(pathname);

  return (
    <div className="flex items-center gap-2 px-3 py-3 sm:px-4 bg-neutral-50/80 border-b border-neutral-200/60 overflow-x-auto scrollbar-hide">
      {adminTabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const TabIcon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={getDefaultRouteForTab(tab)}
            onClick={() => onTabChange?.(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
              isActive
                ? "bg-[#1e3a5f] text-white shadow-sm"
                : "text-neutral-600 hover:bg-neutral-100"
            )}
          >
            <TabIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
