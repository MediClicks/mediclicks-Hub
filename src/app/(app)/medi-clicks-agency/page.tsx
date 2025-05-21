
// src/app/(app)/medi-clicks-agency/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function MediClicksAgencyPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Building2 className="mr-3 h-8 w-8 text-primary" />
          Medi Clicks Agency
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Módulo de Agencia</CardTitle>
          <CardDescription>
            Funcionalidades específicas para la gestión de la agencia Medi Clicks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="mx-auto h-16 w-16 text-primary/30 mb-4" />
            <p className="text-lg font-medium">Página en Construcción</p>
            <p className="text-sm">
              Este espacio está reservado para herramientas y datos relevantes para la operativa interna de Medi Clicks Agency.
            </p>
            <p className="text-sm mt-1">
              Próximamente encontrarás aquí información sobre el rendimiento del equipo, gestión de recursos y más.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
