
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, Users, BarChart3, BookOpen, FileText, Zap, Briefcase, Brain, Lightbulb, TrendingUp } from "lucide-react";
import { Chatbot } from "@/components/ai-agency/chatbot";
import { Badge } from "@/components/ui/badge";

interface CapabilityCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const CapabilityCard: React.FC<CapabilityCardProps> = ({ icon: Icon, title, description }) => (
  <Card className="bg-card hover:shadow-lg transition-shadow duration-300 border-l-4 border-primary/30 flex flex-col">
    <CardHeader className="pb-3 pt-4 px-4">
      <div className="flex justify-between items-center mb-1">
        <CardTitle className="text-base font-semibold flex items-center text-foreground">
          <Icon className="mr-2 h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <Badge variant="outline" className="text-xs border-accent text-accent">Próximamente</Badge>
      </div>
    </CardHeader>
    <CardContent className="px-4 pb-4 flex-grow">
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
    </CardContent>
  </Card>
);

export default function MediClicksAiAgencyPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Bot className="mr-3 h-8 w-8 text-primary" />
          Medi Clicks AI Agency
        </h1>
      </div>
      
      <Card className="shadow-xl border-t-4 border-primary">
        <CardHeader>
          <CardTitle className="text-2xl">Panel de Control de la Agencia IA</CardTitle>
          <CardDescription>
            Interactúa con MC Agent, tu asistente personal potenciado por IA, y explora las futuras capacidades de gestión para tu agencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10">
          <Card className="border-primary/50 shadow-inner">
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

          <div className="border-t border-border pt-8">
            <h3 className="text-2xl font-semibold mb-6 text-center text-primary flex items-center justify-center gap-2">
              <Zap className="h-7 w-7 text-primary/90"/>
              Próximas Capacidades Avanzadas del Agente IA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CapabilityCard 
                icon={Users} 
                title="Gestión Inteligente de Equipo" 
                description="Asistencia en la asignación de tareas, seguimiento de rendimiento del equipo y optimización de cargas de trabajo mediante IA." 
              />
              <CapabilityCard 
                icon={TrendingUp} 
                title="Analíticas Predictivas de Agencia" 
                description="Análisis avanzados y predicciones sobre KPIs, rentabilidad de proyectos, y tendencias del mercado para la toma de decisiones estratégicas." 
              />
              <CapabilityCard 
                icon={Brain} 
                title="Base de Conocimiento Dinámica" 
                description="MC Agent aprenderá de tus documentos, procesos y mejores prácticas para ofrecer respuestas y soluciones personalizadas para la agencia." 
              />
              <CapabilityCard 
                icon={FileText} 
                title="Asistente de Propuestas y Contratos" 
                description="Ayuda en la redacción, personalización y seguimiento de propuestas comerciales, con análisis de efectividad." 
              />
               <CapabilityCard 
                icon={Briefcase} 
                title="Optimización de Flujos de Trabajo" 
                description="Identificación de cuellos de botella y sugerencias para automatizar y optimizar procesos internos de la agencia." 
              />
               <CapabilityCard 
                icon={Lightbulb} 
                title="Generación Estratégica de Contenido" 
                description="Más allá de simples posts, MC Agent ayudará a planificar estrategias de contenido, identificar temas virales y analizar el engagement." 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
