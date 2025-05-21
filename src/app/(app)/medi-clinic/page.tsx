
// src/app/(app)/medi-clinic/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hospital } from "lucide-react";

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
          <CardTitle>Módulo de Clínica</CardTitle>
          <CardDescription>
            Funcionalidades específicas para la gestión de clínicas clientes (si aplica).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Hospital className="mx-auto h-16 w-16 text-cyan-600/30 mb-4" />
            <p className="text-lg font-medium">Página en Construcción</p>
            <p className="text-sm">
              Aquí se integrarán herramientas para la administración de información y servicios relacionados con las clínicas clientes.
            </p>
            <p className="text-sm mt-1">
              Podría incluir gestión de campañas específicas, seguimiento de pacientes (con permisos adecuados), etc.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
