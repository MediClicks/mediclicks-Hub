
// src/app/(app)/medi-clicks-dashboard/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Target, Users, BarChartHorizontal, DollarSign, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { getBillingSummaryTool, getClientCountTool, getUpcomingTasksTool } from "@/ai/tools/agency-tools";
import { format } from "date-fns";

export default function MediClicksDashboardPage() {
  const [annualIncome, setAnnualIncome] = useState<number | null>(null);
  const [clientCount, setClientCount] = useState<number | null>(null);
  const [upcomingTasksSummary, setUpcomingTasksSummary] = useState<string | null>(null);
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

          <useEffect(() => {
            const fetchDashboardData = async () => {
              // Fetch Annual Income
              try {
                const currentYear = new Date().getFullYear();
                const incomeData = await getBillingSummaryTool({ year: currentYear });
                setAnnualIncome(incomeData.totalIncome);
              } catch (error) {
                console.error("Error fetching annual income:", error);
                setAnnualIncome(null); // Or set an error state
              }

              // Fetch Client Count
              try {
                const clientData = await getClientCountTool({});
                setClientCount(clientData.count);
              } catch (error) {
                console.error("Error fetching client count:", error);
                setClientCount(null); // Or set an error state
              }

              // Fetch Upcoming Tasks
              try {
                const tasksData = await getUpcomingTasksTool({});
                setUpcomingTasksSummary(tasksData.summary);
              } catch (error) {
                console.error("Error fetching upcoming tasks:", error);
                setUpcomingTasksSummary("Error al cargar tareas próximas."); // Or set an error state
              }
            };
            fetchDashboardData();
          }, []); // Empty dependency array means this effect runs once on mount

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
                  Total Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientCount !== null ? (
                  <div className="text-2xl font-bold text-blue-600">
                    {clientCount}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Cargando total de clientes...
                  </p>
                )}
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
                  <DollarSign className="mr-2 h-4 w-4 text-indigo-400" />
                  Ingreso Bruto Anual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {annualIncome !== null ? (
                  <div className="text-2xl font-bold text-green-600">
                    {annualIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} {/* Format as currency */}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Cargando ingreso anual...
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <BarChartHorizontal className="mr-2 h-4 w-4 text-indigo-400" />
                  Tareas Próximas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingTasksSummary !== null ? (
                  <p className="text-sm text-muted-foreground">
                    {upcomingTasksSummary}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Cargando resumen de tareas...</p>
                )}
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
