
// src/app/(app)/medi-clicks-dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Target, Users, BarChartHorizontal, DollarSign, Lightbulb } from "lucide-react";

export default function MediClicksDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <AreaChart className="mr-3 h-8 w-8 text-indigo-500" />
          Medi Clicks Dashboard
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Dashboard Analítico Medi Clicks</CardTitle>
          <CardDescription>
            Métricas avanzadas y visualizaciones clave para la toma de decisiones estratégicas en Medi Clicks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-6 text-muted-foreground border-b mb-6">
            <AreaChart className="mx-auto h-16 w-16 text-indigo-500/30 mb-4" />
            <p className="text-lg font-medium">Módulo en Desarrollo Avanzado</p>
            <p className="text-sm">
             Este panel presentará KPIs granulares y análisis de tendencias para optimizar las operaciones de la agencia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <Target className="mr-2 h-4 w-4 text-indigo-400" />
                   Visión General de KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Métricas clave de rendimiento de la agencia y clientes consolidados. (Próximamente)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <Users className="mr-2 h-4 w-4 text-indigo-400" />
                   Rendimiento de Adquisición
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Análisis de embudos de conversión, coste por adquisición (CPA) y valor de vida del cliente (LTV).
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <BarChartHorizontal className="mr-2 h-4 w-4 text-indigo-400" />
                   Efectividad de Campañas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  ROI por campaña, rendimiento por canal y segmentación de audiencias.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <DollarSign className="mr-2 h-4 w-4 text-indigo-400" />
                   Análisis de Rentabilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Rentabilidad por servicio, por cliente y análisis de márgenes.
                </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                   <Lightbulb className="mr-2 h-4 w-4 text-indigo-400" />
                   Proyecciones y Tendencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Modelos predictivos y análisis de tendencias de mercado para anticipar oportunidades.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
