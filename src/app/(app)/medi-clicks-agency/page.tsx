
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, Users, BarChart3, BookOpen, FileText, Cog, Zap } from "lucide-react";
import { Chatbot } from "@/components/ai-agency/chatbot";
import { Badge } from "@/components/ui/badge";

export default function MediClicksAiAgencyPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Bot className="mr-3 h-8 w-8 text-primary" />
          Medi Clicks AI Agency
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Panel de Control de la Agencia IA</CardTitle>
          <CardDescription>
            Interactúa con MC Agent, tu asistente personal, y explora las futuras capacidades de gestión de tu agencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Bot className="mr-2 h-6 w-6 text-accent" />
                MC Agent
              </CardTitle>
              <CardDescription>
                Haz preguntas, pide resúmenes, envía imágenes para análisis o solicita ayuda con tareas relacionadas con la agencia al Dr. Alejandro.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-1 md:p-2">
              <Chatbot />
            </CardContent>
          </Card>

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-6 text-center text-primary flex items-center justify-center">
              <Zap className="mr-2 h-6 w-6"/>
              Próximas Capacidades del Agente IA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-secondary/30 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium flex items-center">
                      <Users className="mr-2 h-4 w-4 text-primary/80" />
                      Gestión de Equipo
                    </CardTitle>
                    <Badge variant="outline" className="text-xs border-primary/50 text-primary/80">Próximamente</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Administración de miembros del equipo, asignación de roles y seguimiento de permisos.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                   <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4 text-primary/80" />
                      Analíticas de Agencia
                    </CardTitle>
                     <Badge variant="outline" className="text-xs border-primary/50 text-primary/80">Próximamente</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Visualización de KPIs de rendimiento, rentabilidad de proyectos y eficiencia operativa.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium flex items-center">
                      <BookOpen className="mr-2 h-4 w-4 text-primary/80" />
                      Biblioteca de Recursos
                    </CardTitle>
                    <Badge variant="outline" className="text-xs border-primary/50 text-primary/80">Próximamente</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Acceso centralizado a documentación interna, plantillas, guías de estilo y procesos operativos.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-primary/80" />
                      Gestión de Propuestas
                    </CardTitle>
                    <Badge variant="outline" className="text-xs border-primary/50 text-primary/80">Próximamente</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Asistencia en la creación, seguimiento y gestión de propuestas comerciales para clientes.
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
