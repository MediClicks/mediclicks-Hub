
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Receipt,
  Settings,
  Building2,
  Hospital,
  Bot, // Nuevo ícono de Robot
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  tooltip?: string;
  subItems?: NavItem[];
  active?: boolean;
  isSectionTitle?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Panel Principal", icon: LayoutDashboard, tooltip: "Vista General" },
  { href: "/clients", label: "Clientes", icon: Users, tooltip: "Gestionar Clientes" },
  { href: "/tasks", label: "Tareas", icon: ListChecks, tooltip: "Seguimiento de Tareas" },
  { href: "/billing", label: "Facturación", icon: Receipt, tooltip: "Facturas y Pagos" },
  { isSectionTitle: true, label: "Medi Clicks - Extensiones", icon: Building2 }, // Texto cambiado
  { href: "/medi-clicks-agency", label: "Medi Clicks Agency", icon: Bot, tooltip: "Gestión de Agencia" }, // Icono cambiado
  { href: "/medi-clinic", label: "Medi Clinic", icon: Hospital, tooltip: "Gestión de Clínica" },
];

export const bottomNavItems: NavItem[] = [
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
    {!collapsed && <span className="text-xl font-semibold text-sidebar-foreground font-mono">MediClicks Hub</span>} {/* Fuente cambiada a font-mono */}
  </div>
);
