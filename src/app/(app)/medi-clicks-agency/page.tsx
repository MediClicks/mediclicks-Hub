
// src/app/(app)/medi-clicks-agency/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, Users, BarChart3, BookOpen, FileText, Cog } from "lucide-react"; // Icono principal cambiado a Bot

export default function MediClicksAgencyPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Bot className="mr-3 h-8 w-8 text-primary" /> {/* Icono principal cambiado a Bot */}
          Medi Clicks Agency
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Módulo de Agencia Medi Clicks</CardTitle>
          <CardDescription>
            Herramientas y funcionalidades para la gestión y operativa interna de la agencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-6 text-muted-foreground border-b mb-6">
            <Bot className="mx-auto h-16 w-16 text-primary/30 mb-4" /> {/* Icono principal cambiado a Bot */}
            <p className="text-lg font-medium">Módulo en Desarrollo</p>
            <p className="text-sm">
              Este espacio está reservado para herramientas y datos relevantes para la operativa interna de Medi Clicks Agency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <Users className="mr-2 h-4 w-4 text-primary/70" />
                   Gestión de Equipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Administración de miembros del equipo, roles y permisos. (Próximamente)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <BarChart3 className="mr-2 h-4 w-4 text-primary/70" />
                   Analíticas de Agencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  KPIs de rendimiento de la agencia, rentabilidad de proyectos, etc. (Próximamente)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <BookOpen className="mr-2 h-4 w-4 text-primary/70" />
                   Biblioteca de Recursos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Documentación interna, plantillas, guías de estilo y procesos. (Próximamente)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <FileText className="mr-2 h-4 w-4 text-primary/70" />
                   Gestión de Propuestas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Creación y seguimiento de propuestas comerciales a clientes. (Próximamente)
                </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <Cog className="mr-2 h-4 w-4 text-primary/70" />
                   Configuración Específica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Ajustes y personalizaciones para la operativa de la agencia. (Próximamente)
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
