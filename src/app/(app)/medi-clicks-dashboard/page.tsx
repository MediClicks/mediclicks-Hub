
// src/app/(app)/medi-clicks-dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart } from "lucide-react";

export default function MediClicksDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Medi Clicks Dashboard</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AreaChart className="mr-2 h-6 w-6 text-primary" />
            Dashboard Específico
          </CardTitle>
          <CardDescription>
            Visualizaciones y métricas personalizadas para Medi Clicks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Página en construcción.</p>
            <p>Este dashboard presentará indicadores clave de rendimiento (KPIs) y analíticas avanzadas.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
