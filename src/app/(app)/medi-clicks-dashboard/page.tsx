
// src/app/(app)/medi-clicks-dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart } from "lucide-react";

export default function MediClicksDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <AreaChart className="mr-3 h-8 w-8 text-indigo-600" />
          Medi Clicks Dashboard
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Dashboard Específico Medi Clicks</CardTitle>
          <CardDescription>
            Visualizaciones y métricas personalizadas para la toma de decisiones en Medi Clicks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <AreaChart className="mx-auto h-16 w-16 text-indigo-600/30 mb-4" />
            <p className="text-lg font-medium">Página en Construcción</p>
            <p className="text-sm">
              Este dashboard presentará indicadores clave de rendimiento (KPIs) y analíticas avanzadas relevantes para Medi Clicks.
            </p>
             <p className="text-sm mt-1">
              Incluirá datos sobre adquisición de clientes, efectividad de campañas, y más.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
