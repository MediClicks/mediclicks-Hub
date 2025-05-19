
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BarChart3 } from "lucide-react";
import React from "react";

export default function SettingsPage() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setIsDark(isCurrentlyDark);
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setIsDark(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Información del Perfil</CardTitle>
          <CardDescription>Actualiza tus datos personales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" defaultValue="Admin" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Apellidos</Label>
              <Input id="lastName" defaultValue="Usuario" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Dirección de Email</Label>
            <Input id="email" type="email" defaultValue="admin@mediclicks.hub" />
          </div>
          <Button>Guardar Cambios</Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>Gestiona tus preferencias de notificación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
              <span>Notificaciones por Email</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Recibe actualizaciones importantes por email.
              </span>
            </Label>
            <Switch id="emailNotifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pushNotifications" className="flex flex-col space-y-1">
              <span>Notificaciones Push</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Recibe alertas en tiempo real en la app. (Requiere configuración)
              </span>
            </Label>
            <Switch id="pushNotifications" disabled />
          </div>
           <Button>Guardar Preferencias</Button>
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>Personaliza el aspecto de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
            <Label htmlFor="darkMode" className="flex flex-col space-y-1">
              <span>Modo Oscuro</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Alternar entre tema claro y oscuro.
              </span>
            </Label>
            <Switch 
              id="darkMode" 
              checked={isDark}
              onCheckedChange={toggleDarkMode} 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Analíticas de Facturación
          </CardTitle>
          <CardDescription>Visualiza el rendimiento financiero de tu compañía.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Los gráficos de facturación estarán disponibles aquí próximamente.</p>
            <p className="text-sm">Esta sección mostrará información visual sobre ingresos, facturas pagadas, pendientes, etc.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
