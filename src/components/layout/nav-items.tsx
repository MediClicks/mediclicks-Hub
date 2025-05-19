
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Receipt,
  Lightbulb,
  Settings,
  // LifeBuoy // Removed as Support page is deleted
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  tooltip?: string;
  subItems?: NavItem[];
  active?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Panel Principal", icon: LayoutDashboard, tooltip: "Vista General" },
  { href: "/clients", label: "Clientes", icon: Users, tooltip: "Gestionar Clientes" },
  { href: "/tasks", label: "Tareas", icon: ListChecks, tooltip: "Seguimiento de Tareas" },
  { href: "/billing", label: "Facturación", icon: Receipt, tooltip: "Facturas y Pagos" },
  { href: "/content-suggestions", label: "Sugerencias IA", icon: Lightbulb, tooltip: "Ideas de Contenido" },
];

export const bottomNavItems: NavItem[] = [
  { href: "/settings", label: "Configuración", icon: Settings, tooltip: "Ajustes de la App" },
  // { href: "/support", label: "Soporte", icon: LifeBuoy, tooltip: "Ayuda y Soporte" }, // Removed
];

export const AppLogo = ({ collapsed }: { collapsed?: boolean }) => (
  <div className="flex items-center gap-2 px-2 py-1">
    {/* Assuming logo-mediclicks.png is in public/images/ */}
    <Image 
      src="/images/logo-mediclicks.png" 
      alt="MediClicks Hub Logo" 
      width={collapsed ? 32 : 32} // Adjust size as needed
      height={collapsed ? 32 : 32} // Adjust size as needed
      className="object-contain"
      data-ai-hint="company logo"
    />
    {!collapsed && <span className="text-xl font-semibold text-sidebar-foreground">MediClicks Hub</span>}
  </div>
);
