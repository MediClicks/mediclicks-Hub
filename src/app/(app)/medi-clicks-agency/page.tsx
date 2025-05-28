
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Lightbulb, BarChart3, CheckCircle, Users, Bot, FileText, Zap, BookOpen, Settings2, Briefcase, MessageSquare, ShieldCheck, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from '@/lib/utils'; // Added import

interface CapabilityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "En Desarrollo" | "Próximamente";
}

function CapabilityCard({ icon: Icon, title, description, status }: CapabilityCardProps) {
  return (
    <Card className="bg-secondary/30 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium flex items-center">
            <Icon className="mr-2 h-4 w-4 text-primary/80" />
            {title}
          </CardTitle>
          <Badge variant={status === "En Desarrollo" ? "default" : "outline"} className={cn(
            "text-xs",
            status === "En Desarrollo" ? "bg-amber-500/80 border-amber-600 text-white" : "border-primary/50 text-primary/80"
          )}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function MediClicksAgencyPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <BrainCircuit className="mr-3 h-8 w-8 text-primary" />
          Medi Clicks Agency - Centro de IA Avanzada
        </h1>
      </div>
      <Card className="shadow-lg border-t-4 border-primary">
        <CardHeader>
          <CardTitle>Panel de Control de Funciones Avanzadas de Il Dottore</CardTitle>
          <CardDescription>
            Explora las capacidades en desarrollo y futuras de Il Dottore para optimizar las operaciones de Medi Clicks Agency.
            La interacción principal con Il Dottore se realiza desde el chatbot en el Panel Principal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-6 text-center text-primary flex items-center justify-center">
              <Zap className="mr-2 h-6 w-6"/>
              Módulos de Asistencia Avanzada
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CapabilityCard
                icon={Lightbulb}
                title="AI Study Assistant"
                description="Il Dottore te ayudará a investigar tendencias, analizar competidores y obtener insights del mercado para estrategias más efectivas."
                status="En Desarrollo"
              />
              <CapabilityCard
                icon={BarChart3}
                title="Medi Clicks Analitics"
                description="Análisis predictivo de rendimiento de campañas, segmentación de audiencias avanzada y recomendaciones de optimización basadas en datos."
                status="Próximamente"
              />
              <CapabilityCard
                icon={CheckCircle}
                title="Task Resolving & Automation"
                description="Identificación y automatización de tareas repetitivas. Asistencia proactiva en la resolución de cuellos de botella en proyectos."
                status="En Desarrollo"
              />
              <CapabilityCard
                icon={MessageSquare}
                title="Social Media Manager Pro"
                description="Generación avanzada de calendarios de contenido, programación inteligente de publicaciones y análisis de engagement con sugerencias de mejora."
                status="Próximamente"
              />
               <CapabilityCard
                icon={Users}
                title="Gestión de Equipo Asistida"
                description="Asistencia en la asignación de tareas al equipo, seguimiento de cargas de trabajo y facilitación de la comunicación interna."
                status="Próximamente"
              />
              <CapabilityCard
                icon={FileText}
                title="Gestión de Propuestas Inteligente"
                description="Ayuda en la redacción de propuestas comerciales, personalización según el cliente y seguimiento de su estado."
                status="Próximamente"
              />
               <CapabilityCard
                icon={BookOpen}
                title="Biblioteca de Recursos Dinámica"
                description="Acceso y búsqueda inteligente en la documentación interna, plantillas y guías de estilo. Il Dottore puede ayudarte a encontrar lo que necesitas."
                status="En Desarrollo"
              />
                <CapabilityCard
                icon={ShieldCheck}
                title="Asesor de Cumplimiento y Calidad"
                description="Revisión de contenido para asegurar el cumplimiento de normativas (ej. publicidad médica) y mantenimiento de estándares de calidad."
                status="Próximamente"
              />
               <CapabilityCard
                icon={Target}
                title="Definición y Seguimiento de KPIs"
                description="Ayuda para establecer KPIs relevantes para cada cliente y campaña, y asistencia en el seguimiento de su progreso."
                status="En Desarrollo"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
