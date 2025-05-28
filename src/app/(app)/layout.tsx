
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { useAuth } from '@/contexts/auth-context';
import { useNotification } from '@/contexts/notification-context';
import { Loader2, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


function getPageTitle(pathname: string): string {
  const allNavItems = [...navItems, ...bottomNavItems].filter(item => item.href && !item.isSectionTitle);
  
  let item = allNavItems.find(navItem => navItem.href && pathname === navItem.href);
  if (item) return item.label;

  // Check for active parent items (e.g. /clients for /clients/add)
  item = allNavItems
    .filter(navItem => navItem.href && navItem.href !== '/') // Exclude dashboard for this check
    .sort((a, b) => (b.href?.length || 0) - (a.href?.length || 0)) // Sort by length to match longer paths first
    .find(navItem => navItem.href && pathname.startsWith(navItem.href));
  
  if (item) return item.label;

  // Default to "Panel Principal" or a generic title if no match
  return "Panel Principal";
}

const sidebarIconColors: Record<string, string> = {
  "/dashboard": "text-sky-400",
  "/clients": "text-lime-400",
  "/tasks": "text-amber-400",
  "/billing": "text-rose-400",
  // "/medi-clicks-ai-agency": "text-purple-400", // Icono Bot, eliminado
  "/medi-clinic": "text-cyan-400",
  "/settings": "text-slate-400",
  // El color de la campana se maneja de forma especial
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [open, setOpen] = React.useState(true);
  
  const { isAuthenticated, isLoading: isLoadingAuth, logout } = useAuth();
  const notificationContext = useNotification();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoadingAuth, router]);

  const fetchNotificationsCallback = React.useCallback(() => {
    if (isAuthenticated && notificationContext) {
      notificationContext.fetchNotifications();
    }
  }, [isAuthenticated, notificationContext]);

  React.useEffect(() => {
    fetchNotificationsCallback();
  }, [fetchNotificationsCallback]);


  if (isLoadingAuth || !isAuthenticated) {
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
      
      let iconColorClass = pathname.startsWith(item.href || '__never__') && !item.isNotification
        ? "text-sidebar-accent-foreground" 
        : sidebarIconColors[item.href || ''] || "text-sidebar-foreground/80";

      if (item.isNotification && notificationContext && notificationContext.unreadCount > 0) {
        iconColorClass = "text-red-500"; 
      } else if (item.isNotification) {
        iconColorClass = sidebarIconColors["/notifications"] || "text-sidebar-foreground/80";
      }
      

      if (item.href === '/logout') { 
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              onClick={logout}
              tooltip={isCollapsed ? item.tooltip || item.label : undefined}
            >
              <IconComponent className={cn("group-hover:text-sidebar-accent-foreground", iconColorClass)} />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      }

      if (item.isNotification && notificationContext) {
        const bellIconClasses = cn(
          "group-hover:text-sidebar-accent-foreground",
          iconColorClass,
          notificationContext.unreadCount > 0 && isCollapsed && "animate-pulse" // Pulse only when collapsed and unread
        );
        return (
          <SidebarMenuItem key={item.href || `notification-item-${index}`}>
             <DropdownMenu onOpenChange={(open) => {
                if (open && notificationContext.unreadCount > 0) {
                  notificationContext.markNotificationsAsRead();
                }
             }}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip={isCollapsed ? item.tooltip || item.label : undefined}
                  className="relative"
                >
                  <IconComponent className={bellIconClasses} />
                  <span>{item.label}</span>
                  {notificationContext.unreadCount > 0 && !isCollapsed && (
                    <Badge className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-1.5 text-xs bg-red-500 text-white">
                      {notificationContext.unreadCount}
                    </Badge>
                  )}
                   {notificationContext.unreadCount > 0 && isCollapsed && (
                     <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                   )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 ml-2 max-h-80 overflow-y-auto" side="right" align="start">
                <DropdownMenuLabel>Notificaciones (Tareas Próximas)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationContext.isLoadingNotifications && (
                  <DropdownMenuItem disabled className="text-sm text-center text-muted-foreground py-3 flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
                  </DropdownMenuItem>
                )}
                {!notificationContext.isLoadingNotifications && notificationContext.notifications.length > 0 ? (
                  notificationContext.notifications.map(task => (
                    <DropdownMenuItem key={task.id} asChild>
                      <Link href={`/tasks/${task.id}/edit`} className="text-sm cursor-pointer">
                        <div className="flex flex-col w-full">
                          <span className="font-medium truncate">{task.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Cliente: {task.clientName || 'N/A'} - Vence: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'N/A'}
                          </span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  !notificationContext.isLoadingNotifications && (
                    <DropdownMenuItem disabled className="text-sm text-center text-muted-foreground py-3">
                      No hay tareas que venzan en las próximas 24h.
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        );
      }


      return (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href || '#'} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={item.href ? pathname.startsWith(item.href) : false}
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
