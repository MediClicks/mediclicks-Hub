
// src/app/(app)/medi-clinic/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hospital } from "lucide-react";

export default function MediClinicPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Medi Clinic</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Hospital className="mr-2 h-6 w-6 text-primary" />
            Módulo de Clínica
          </CardTitle>
          <CardDescription>
            Funcionalidades específicas para la gestión de clínicas (si aplica).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Página en construcción.</p>
            <p>Aquí se integrarán herramientas para la administración de información de clínicas clientes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
