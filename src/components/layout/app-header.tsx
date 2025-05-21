
'use client';

import Link from 'next/link';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings as SettingsIcon, Sun, Moon } from "lucide-react";
import * as React from 'react';
import { useAuth } from '@/contexts/auth-context'; // Importar useAuth

interface AppHeaderProps {
  pageTitle: string;
}

export function AppHeader({ pageTitle }: AppHeaderProps) {
  const [isDark, setIsDark] = React.useState(false);
  const { logout } = useAuth(); // Obtener la función logout

  React.useEffect(() => {
    const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 sm:h-16 sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-lg font-semibold sm:text-xl md:text-2xl whitespace-nowrap">{pageTitle}</h1>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode} title={isDark ? "Activar modo claro" : "Activar modo oscuro"}>
          {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-primary" />}
          <span className="sr-only">Cambiar Tema</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <User className="h-5 w-5 text-primary" />
               <span className="sr-only">Menú de Usuario</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Usuario Admin</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@mediclicks.hub
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings"> 
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <SettingsIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Configuración</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}> {/* Usar la función logout del contexto */}
              <LogOut className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
