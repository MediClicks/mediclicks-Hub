
// src/app/(app)/medi-clinic/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hospital, Activity, BookOpen, Settings2, Users, BarChart3, ListChecks } from "lucide-react";

export default function MediClinicPage() {
  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Hospital className="mr-3 h-8 w-8 text-cyan-600" />
          Medi Clinic
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Módulo de Gestión para Clínicas</CardTitle>
          <CardDescription>
            Herramientas y funcionalidades especializadas para clínicas clientes de Medi Clicks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-6 text-muted-foreground border-b mb-6">
            <Hospital className="mx-auto h-16 w-16 text-cyan-600/30 mb-4" />
            <p className="text-lg font-medium">Módulo en Desarrollo</p>
            <p className="text-sm">
              Este espacio se está construyendo para ofrecer soluciones específicas para las clínicas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <Activity className="mr-2 h-4 w-4 text-cyan-500" />
                   Gestión de Campañas Clínicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Planificación, seguimiento y análisis de campañas de marketing digital específicas para cada clínica cliente.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <BarChart3 className="mr-2 h-4 w-4 text-cyan-500" />
                   Analíticas Específicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Informes y KPIs adaptados al sector salud: adquisición de pacientes, ROI de campañas, visibilidad online.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <BookOpen className="mr-2 h-4 w-4 text-cyan-500" />
                   Recursos de Marketing Médico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Biblioteca de recursos, guías de buenas prácticas y plantillas para marketing en el sector salud.
                </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <Settings2 className="mr-2 h-4 w-4 text-cyan-500" />
                   Configuración y Perfil Clínico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Gestión de la información específica de cada clínica, especialidades, y objetivos de marketing.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
