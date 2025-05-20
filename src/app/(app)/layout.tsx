
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  useSidebar,
  SidebarGroupLabel, // Importado para los títulos de sección
} from '@/components/ui/sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { navItems, bottomNavItems, AppLogo, type NavItem } from '@/components/layout/nav-items';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from '@/components/ui/separator';

function getPageTitle(pathname: string): string {
  const allNavItems = [...navItems, ...bottomNavItems].filter(item => !item.isSectionTitle); // Excluir títulos de sección
  const item = allNavItems.find(navItem => navItem.href && pathname.startsWith(navItem.href));
  return item ? item.label : "Panel Principal"; // Default to "Panel Principal"
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [open, setOpen] = React.useState(true); // Default sidebar state

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
      return (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname.startsWith(item.href)}
              tooltip={isCollapsed ? item.tooltip || item.label : undefined}
            >
              <item.icon />
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
