
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Receipt,
  Lightbulb,
  Settings,
  Building2, 
  Hospital, 
  AreaChart,
  LogOut, // Importar LogOut
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
  { href: "/content-suggestions", label: "Sugerencias IA", icon: Lightbulb, tooltip: "Ideas de Contenido" },
  { isSectionTitle: true, label: "Módulos Adicionales", icon: Building2 },
  { href: "/medi-clicks-agency", label: "Medi Clicks Agency", icon: Building2, tooltip: "Gestión de Agencia" },
  { href: "/medi-clinic", label: "Medi Clinic", icon: Hospital, tooltip: "Gestión de Clínica" },
  { href: "/medi-clicks-dashboard", label: "Medi Clicks Dashboard", icon: AreaChart, tooltip: "Dashboard Específico" },
];

export const bottomNavItems: NavItem[] = [
  { href: "/settings", label: "Configuración", icon: Settings, tooltip: "Ajustes de la App" },
  // Se mueve el logout al menú de usuario en el header, pero si se quisiera aquí:
  // { href: "/logout", label: "Cerrar Sesión", icon: LogOut, tooltip: "Salir de la App" },
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
    {!collapsed && <span className="text-xl font-semibold text-sidebar-foreground">MediClicks Hub</span>}
  </div>
);
