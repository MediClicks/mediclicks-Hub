
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Receipt,
  Settings,
  Building2,
  Hospital,
  Bell,
  BrainCircuit, // Nuevo ícono para Medi Clicks Agency
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip?: string;
  subItems?: NavItem[];
  active?: boolean;
  isSectionTitle?: boolean;
  isNotification?: boolean;
  notificationCount?: number;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Panel Principal", icon: LayoutDashboard, tooltip: "Vista General" },
  { href: "/clients", label: "Clientes", icon: Users, tooltip: "Gestionar Clientes" },
  { href: "/tasks", label: "Tareas", icon: ListChecks, tooltip: "Seguimiento de Tareas" },
  { href: "/billing", label: "Facturación", icon: Receipt, tooltip: "Facturas y Pagos" },
  { isSectionTitle: true, label: "Medi Clicks - Extensiones", icon: Building2 },
  { href: "/medi-clicks-agency", label: "Medi Clicks Agency", icon: BrainCircuit, tooltip: "Agencia IA Avanzada" },
  { href: "/medi-clinic", label: "Medi Clinic", icon: Hospital, tooltip: "Gestión de Clínica" },
];

export const bottomNavItems: NavItem[] = [
  { href: "#", label: "Notificaciones", icon: Bell, tooltip: "Ver Notificaciones", isNotification: true, notificationCount: 0 },
  { href: "/settings", label: "Configuración", icon: Settings, tooltip: "Ajustes de la App" },
];

export const AppLogo = ({ collapsed }: { collapsed?: boolean }) => (
  <div className="flex items-center gap-2 px-2 py-1">
    <Image
      src="/images/logo-mediclicks.png"
      alt="MediClicks Hub Logo"
      width={collapsed ? 32 : 32}
      height={collapsed ? 32 : 32}
      className="object-contain"
      data-ai-hint="company logo"
    />
    {!collapsed && (
       <span className="flex items-baseline">
        <span className="text-lg font-bold text-sidebar-foreground tracking-tight">MEDI</span>
        <span className="text-lg font-bold text-sidebar-foreground tracking-tight">-</span>
        <span className="text-lg font-bold text-sidebar-foreground tracking-tight">CLICKS</span>
        <span className="text-xs font-normal text-sidebar-foreground/80 ml-1 self-end pb-0.5">Hub</span>
      </span>
    )}
  </div>
);
