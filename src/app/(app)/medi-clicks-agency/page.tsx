
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, Users, BarChart3, BookOpen, FileText, Cog } from "lucide-react";
import { Chatbot } from "@/components/ai-agency/chatbot"; // Importar el nuevo chatbot

export default function MediClicksAiAgencyPage() { // Nombre de la función cambiado
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Bot className="mr-3 h-8 w-8 text-primary" />
          Medi Clicks AI Agency {/* Título de página actualizado */}
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Tu Asistente de Agencia IA</CardTitle>
          <CardDescription>
            Interactúa con tu asistente personal de IA. Con el tiempo, aprenderá a administrar aspectos de Medi Clicks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-1 md:p-2">
            <Chatbot /> {/* Chatbot integrado aquí */}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-center text-muted-foreground">Próximas Capacidades del Agente IA:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <Card className="bg-secondary/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Users className="mr-2 h-4 w-4 text-primary/70" />
                    Gestión de Equipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Administración de miembros del equipo, roles y permisos.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4 text-primary/70" />
                    Analíticas de Agencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    KPIs de rendimiento de la agencia, rentabilidad de proyectos, etc.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-primary/70" />
                    Biblioteca de Recursos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Documentación interna, plantillas, guías de estilo y procesos.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-primary/70" />
                    Gestión de Propuestas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Creación y seguimiento de propuestas comerciales a clientes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
