
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Receipt,
  Lightbulb,
  Blend,
  Settings,
  LifeBuoy
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  tooltip?: string;
  subItems?: NavItem[];
  active?: boolean; // Added for explicit active state management if needed outside path matching
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tooltip: "Dashboard Overview" },
  { href: "/clients", label: "Clients", icon: Users, tooltip: "Manage Clients" },
  { href: "/tasks", label: "Tasks", icon: ListChecks, tooltip: "Track Tasks" },
  { href: "/billing", label: "Billing", icon: Receipt, tooltip: "Invoices & Payments" },
  { href: "/content-suggestions", label: "AI Suggestions", icon: Lightbulb, tooltip: "Content Ideas" },
];

export const bottomNavItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings, tooltip: "App Settings" },
  { href: "/support", label: "Support", icon: LifeBuoy, tooltip: "Help & Support" },
];

export const AppLogo = ({ collapsed }: { collapsed?: boolean }) => (
  <div className="flex items-center gap-2 px-2 py-1">
    <Blend className="h-8 w-8 text-sidebar-primary" />
    {!collapsed && <span className="text-xl font-semibold text-sidebar-foreground">MediClicks Hub</span>}
  </div>
);
