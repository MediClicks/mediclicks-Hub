
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, // Changed from BrainCircuit
  Lightbulb, 
  BarChart3, 
  CheckCircle, 
  Users, 
  FileText, 
  Zap, 
  BookOpen, 
  Settings2, 
  Briefcase, 
  MessageSquare, 
  ShieldCheck, 
  Target,
  ListCollapse,
  Loader2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from '@/lib/utils';
import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import type { SavedConversation, WithConvertedDates } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface CapabilityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "En Desarrollo" | "Próximamente";
}

function CapabilityCard({ icon: Icon, title, description, status }: CapabilityCardProps) {
  return (
    <Card className="bg-secondary/30 hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium flex items-center">
            <Icon className="mr-2 h-4 w-4 text-primary/80" />
            {title}
          </CardTitle>
          <Badge variant={status === "En Desarrollo" ? "default" : "outline"} className={cn(
            "text-xs whitespace-nowrap",
            status === "En Desarrollo" ? "bg-amber-500/80 border-amber-600 text-white" : "border-primary/50 text-primary/80"
          )}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function convertConversationTimestamps(docData: any): WithConvertedDates<SavedConversation> {
  const data = { ...docData } as Partial<WithConvertedDates<SavedConversation>>;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key as keyof SavedConversation];
      if (value instanceof Timestamp) {
        (data[key as keyof SavedConversation] as any) = value.toDate();
      } else if (Array.isArray(value)) {
        // Assuming messages array doesn't contain Timestamps directly, but if it did, you'd convert here.
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        // Recursively convert for nested objects if any (not typical for SavedConversation)
      }
    }
  }
  return data as WithConvertedDates<SavedConversation>;
}


export default function MediClicksAiAgencyPage() {
  const [savedConversations, setSavedConversations] = useState<WithConvertedDates<SavedConversation>[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const { user } = useAuth();

  const fetchSavedConversations = useCallback(async () => {
    if (!user?.uid) {
      setIsLoadingConversations(false); // Stop loading if no user
      return;
    }
    setIsLoadingConversations(true);
    try {
      const q = query(
        collection(db, "savedConversations"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const fetchedConversations = querySnapshot.docs.map(doc => {
        const data = convertConversationTimestamps(doc.data() as SavedConversation);
        return { id: doc.id, ...data } as WithConvertedDates<SavedConversation>;
      });
      setSavedConversations(fetchedConversations);
    } catch (err) {
      console.error("Error fetching saved conversations:", err);
      // Optionally show a toast or error message to the user
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchSavedConversations();
    }
  }, [user?.uid, fetchSavedConversations]);


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Bot className="mr-3 h-8 w-8 text-primary" /> {/* Icon updated to Bot */}
          Medi Clicks AI Agency - Centro de IA Avanzada
        </h1>
      </div>
      <Card className="shadow-lg border-t-4 border-primary">
        <CardHeader>
          <CardTitle>Capacidades de Il Dottore</CardTitle>
          <CardDescription>
            Explora las capacidades actuales y futuras de Il Dottore para optimizar las operaciones de tu agencia.
            Puedes interactuar con Il Dottore desde el chatbot en el Panel Principal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-6 text-center text-primary flex items-center justify-center">
              <Zap className="mr-2 h-6 w-6"/>
              Módulos de Asistencia Avanzada (En Evolución)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CapabilityCard
                icon={MessageSquare}
                title="Asistencia Conversacional"
                description="Il Dottore responde a tus preguntas, ofrece resúmenes y te ayuda con tareas de información general. Disponible en el Panel Principal."
                status="En Desarrollo"
              />
               <CapabilityCard
                icon={Lightbulb}
                title="Brainstorming Creativo"
                description="Genera ideas para campañas, nombres de marca, slogans y contenido. Il Dottore puede ayudarte a superar bloqueos creativos."
                status="Próximamente"
              />
               <CapabilityCard
                icon={FileText}
                title="Asistencia en Redacción"
                description="Ayuda a redactar correos electrónicos, propuestas básicas, descripciones de servicios y borradores de contenido para redes sociales."
                status="Próximamente"
              />
              <CapabilityCard
                icon={BarChart3}
                title="Análisis Básico de Datos"
                description="Interpreta datos simples que le proporciones (ej. métricas de una campaña) y ofrece resúmenes o insights básicos."
                status="En Desarrollo"
              />
              <CapabilityCard
                icon={Settings2}
                title="Optimización de Contenido SEO"
                description="Sugiere mejoras para tus textos orientadas a SEO, identifica palabras clave y analiza la legibilidad."
                status="Próximamente"
              />
              <CapabilityCard
                icon={Users}
                title="Análisis de Sentimiento"
                description="Analiza el sentimiento general de textos, como comentarios de clientes o reseñas, para entender la percepción pública."
                status="Próximamente"
              />
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-6 text-center text-primary flex items-center justify-center">
              <Briefcase className="mr-2 h-6 w-6"/>
              Próximas Capacidades Avanzadas del Agente IA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CapabilityCard
                icon={Lightbulb} // Reutilizando Lightbulb, considera cambiarlo si tienes otro más específico
                title="AI Study Assistant"
                description="Il Dottore te ayudará a investigar tendencias del mercado, analizar la competencia de tus clientes y obtener insights para estrategias de marketing más efectivas."
                status="Próximamente"
              />
              <CapabilityCard
                icon={BarChart3}
                title="Medi Clicks Analitics"
                description="Análisis predictivo del rendimiento de campañas, segmentación de audiencias avanzada y recomendaciones de optimización basadas en datos históricos y tendencias."
                status="Próximamente"
              />
              <CapabilityCard
                icon={CheckCircle}
                title="Task Resolving & Automation"
                description="Identificación proactiva de tareas repetitivas o cuellos de botella en proyectos, sugiriendo o ejecutando automatizaciones para optimizar flujos de trabajo."
                status="Próximamente"
              />
              <CapabilityCard
                icon={MessageSquare} // Reutilizando MessageSquare
                title="Social Media Manager Pro"
                description="Generación avanzada de calendarios de contenido multicanal, programación inteligente de publicaciones y análisis de engagement con sugerencias de mejora y respuesta."
                status="Próximamente"
              />
               <CapabilityCard
                icon={Users} // Reutilizando Users
                title="Gestión de Equipo Asistida"
                description="Asistencia en la asignación de tareas al equipo basada en carga de trabajo y habilidades, seguimiento del progreso y facilitación de la comunicación interna y recordatorios."
                status="Próximamente"
              />
              <CapabilityCard
                icon={FileText} // Reutilizando FileText
                title="Gestión de Propuestas Inteligente"
                description="Ayuda en la redacción de propuestas comerciales personalizadas según el perfil del cliente y los servicios, y seguimiento del estado de las propuestas enviadas."
                status="Próximamente"
              />
               <CapabilityCard
                icon={BookOpen}
                title="Biblioteca de Recursos Dinámica"
                description="Acceso y búsqueda inteligente en la documentación interna, plantillas, guías de estilo y casos de éxito. Il Dottore puede ayudarte a encontrar y aplicar los recursos adecuados."
                status="Próximamente"
              />
                <CapabilityCard
                icon={ShieldCheck}
                title="Asesor de Cumplimiento y Calidad"
                description="Revisión de contenido y campañas para asegurar el cumplimiento de normativas específicas del sector (ej. publicidad médica) y el mantenimiento de los estándares de calidad de la agencia."
                status="Próximamente"
              />
               <CapabilityCard
                icon={Target}
                title="Definición y Seguimiento de KPIs"
                description="Ayuda para establecer KPIs relevantes para cada cliente y campaña, y asistencia en la recolección y visualización de datos para el seguimiento de su progreso."
                status="Próximamente"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <Card className="shadow-lg border-t-4 border-accent">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <ListCollapse className="mr-2 h-5 w-5 text-accent" />
                  Historial de Conversaciones con Il Dottore
                </CardTitle>
                <CardDescription>Conversaciones guardadas previamente.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingConversations && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                {!isLoadingConversations && savedConversations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay conversaciones guardadas.</p>
                )}
                {!isLoadingConversations && savedConversations.length > 0 && (
                  <ScrollArea className="h-[200px] pr-3">
                    <ul className="space-y-2">
                      {savedConversations.map(convo => (
                        <li key={convo.id}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-muted/50"
                            disabled // La funcionalidad de cargar conversación no está implementada
                            title="Cargar esta conversación (funcionalidad futura)"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-primary text-sm truncate">{convo.title}</span>
                              <span className="text-xs text-muted-foreground">
                                Guardada: {convo.createdAt ? format(new Date(convo.createdAt), 'dd/MM/yy HH:mm', { locale: es }) : 'N/A'}
                              </span>
                            </div>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground pt-2">
                Se muestran las últimas 10 conversaciones.
              </CardFooter>
            </Card>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
