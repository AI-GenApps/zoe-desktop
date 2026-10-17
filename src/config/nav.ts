import { CalendarCheck, Home, Bell, LayoutDashboard, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  requiresAuth: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Weekly Tasks", icon: CalendarCheck, path: "/tasks/weekly", requiresAuth: true },
  { label: "Today", icon: Home, path: "/today", requiresAuth: true },
  { label: "Mentions", icon: Bell, path: "/mentions", requiresAuth: true },
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", requiresAuth: true }
];

export const NAV_BOTTOM_ITEMS: NavItem[] = [
  { label: "Settings", icon: Settings, path: "/settings", requiresAuth: true }
];
