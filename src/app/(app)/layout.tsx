
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { navItems, bottomNavItems, AppLogo, type NavItem } from '@/components/layout/nav-items';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context'; // Importar useAuth
import { Loader2 } from 'lucide-react';

function getPageTitle(pathname: string): string {
  const allNavItems = [...navItems, ...bottomNavItems].filter(item => !item.isSectionTitle);
  
  let item = allNavItems.find(navItem => navItem.href && pathname === navItem.href);
  if (item) return item.label;

  item = allNavItems
    .filter(navItem => navItem.href && navItem.href !== '/') 
    .sort((a, b) => b.href.length - a.href.length) 
    .find(navItem => navItem.href && pathname.startsWith(navItem.href));
  
  return item ? item.label : "Panel Principal";
}

const sidebarIconColors: Record<string, string> = {
  "/dashboard": "text-sky-400",
  "/clients": "text-lime-400",
  "/tasks": "text-amber-400",
  "/billing": "text-rose-400",
  "/content-suggestions": "text-violet-400",
  "/medi-clicks-agency": "text-teal-400",
  "/medi-clinic": "text-cyan-400",
  "/medi-clicks-dashboard": "text-indigo-400",
  "/settings": "text-slate-400",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [open, setOpen] = React.useState(true);
  
  const { isAuthenticated, isLoading: isLoadingAuth, logout } = useAuth(); // Usar el hook de autenticación
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoadingAuth, router]);

  if (isLoadingAuth || !isAuthenticated) {
    // Muestra un loader mientras se verifica la autenticación o si no está autenticado y se redirige
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderNavItems = (items: NavItem[], isCollapsed: boolean) => {
    return items.map((item, index) => {
      if (item.isSectionTitle) {
        return (
          <SidebarMenuItem key={`section-${item.label}-${index}`} className="mt-4 mb-1 px-2 pointer-events-none">
            {isCollapsed ? (
              <Separator className="my-2 bg-sidebar-border" />
            ) : (
              <span className="text-xs font-semibold uppercase text-sidebar-foreground/70 tracking-wider">{item.label}</span>
            )}
          </SidebarMenuItem>
        );
      }
      const IconComponent = item.icon;
      const iconColorClass = pathname.startsWith(item.href) 
        ? "text-sidebar-accent-foreground" 
        : sidebarIconColors[item.href] || "text-sidebar-foreground/80";

      // Special case for logout
      if (item.href === '/logout') {
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              onClick={logout} // Llamar a logout al hacer clic
              tooltip={isCollapsed ? item.tooltip || item.label : undefined}
            >
              <IconComponent className={cn("group-hover:text-sidebar-accent-foreground", iconColorClass)} />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      }

      return (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname.startsWith(item.href)}
              tooltip={isCollapsed ? item.tooltip || item.label : undefined}
            >
              <IconComponent className={cn("group-hover:text-sidebar-accent-foreground", iconColorClass)} />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <SidebarProvider open={open} onOpenChange={setOpen} defaultOpen={true}>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="p-2 border-b border-sidebar-border">
          <AppLogo collapsed={!open} />
        </SidebarHeader>
        <ScrollArea className="flex-grow">
          <SidebarContent className="p-2">
            <SidebarMenu>
              {renderNavItems(navItems, !open)}
            </SidebarMenu>
          </SidebarContent>
        </ScrollArea>
        <Separator className="my-0 bg-sidebar-border" />
        <SidebarFooter className="p-2">
          <SidebarMenu>
            {renderNavItems(bottomNavItems, !open)}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen">
        <AppHeader pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
