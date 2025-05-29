
'use client';

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot,
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
  Loader2,
  MessageSquareText,
  User as UserIcon // Renamed to avoid conflict
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from '@/lib/utils';
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import type { SavedConversation, WithConvertedDates, ChatMessage, ChatUIMessage } from "@/types"; // Added ChatMessage
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NextImage from 'next/image';


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

// Helper function to convert Firestore Timestamps
function convertConversationTimestamps(docData: any): WithConvertedDates<SavedConversation> {
  const data = { ...docData } as Partial<WithConvertedDates<SavedConversation>>;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key as keyof SavedConversation];
      if (value instanceof Timestamp) {
        (data[key as keyof SavedConversation] as any) = value.toDate();
      } else if (Array.isArray(value) && key === 'messages') {
         // Messages array should already be ChatMessage[], no direct Timestamps expected inside
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date) && !Array.isArray(value)) {
        // Recursively convert for nested objects if any (not expected for SavedConversation)
      }
    }
  }
  return data as WithConvertedDates<SavedConversation>;
}


export default function MediClicksAiAgencyPage() {
  const [savedConversations, setSavedConversations] = useState<WithConvertedDates<SavedConversation>[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<WithConvertedDates<SavedConversation> | null>(null);
  const [isViewConversationDialogOpen, setIsViewConversationDialogOpen] = useState(false);
  const { user } = useAuth();

  const fetchSavedConversations = useCallback(async () => {
    if (!user?.uid) {
      setIsLoadingConversations(false);
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
        return { id: doc.id, ...data };
      });
      setSavedConversations(fetchedConversations);
    } catch (err) {
      console.error("Error fetching saved conversations:", err);
      // Consider adding a toast message here for the user
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchSavedConversations();
    }
  }, [fetchSavedConversations, user?.uid]);

  const handleViewConversation = (conversation: WithConvertedDates<SavedConversation>) => {
    setSelectedConversation(conversation);
    setIsViewConversationDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Bot className="mr-3 h-8 w-8 text-primary" />
          Medi Clicks AI Agency
        </h1>
      </div>
      <Card className="shadow-lg border-t-4 border-primary">
        <CardHeader>
          <CardTitle>Centro de IA Avanzada - Il Dottore</CardTitle>
          <CardDescription>
            Explora las capacidades actuales y futuras de Il Dottore, tu asistente IA personal.
            Puedes interactuar directamente con Il Dottore desde el chatbot en el Panel Principal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-6 text-primary flex items-center">
              <Zap className="mr-2 h-5 w-5"/>
              Capacidades y Asistencia de Il Dottore (En Evolución)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CapabilityCard
                icon={MessageSquare}
                title="Asistencia Conversacional"
                description="Il Dottore responde a tus preguntas, ofrece resúmenes, te ayuda con información general y ahora puede analizar imágenes que le envíes."
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
            <h3 className="text-xl font-semibold mb-6 text-primary flex items-center">
              <Briefcase className="mr-2 h-5 w-5"/>
              Próximas Capacidades Avanzadas del Agente IA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CapabilityCard
                icon={Lightbulb} 
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
                icon={MessageSquare} 
                title="Social Media Manager Pro"
                description="Generación avanzada de calendarios de contenido multicanal, programación inteligente de publicaciones y análisis de engagement con sugerencias de mejora y respuesta."
                status="Próximamente"
              />
               <CapabilityCard
                icon={Users} 
                title="Gestión de Equipo Asistida"
                description="Asistencia en la asignación de tareas al equipo basada en carga de trabajo y habilidades, seguimiento del progreso y facilitación de la comunicación interna y recordatorios."
                status="Próximamente"
              />
              <CapabilityCard
                icon={FileText} 
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
                <CardDescription>Revisa tus interacciones guardadas previamente.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingConversations && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Cargando conversaciones...</span>
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
                            onClick={() => handleViewConversation(convo)}
                          >
                            <MessageSquareText className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
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

      {selectedConversation && (
        <Dialog open={isViewConversationDialogOpen} onOpenChange={setIsViewConversationDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="truncate pr-10">{selectedConversation.title}</DialogTitle>
              <DialogDescription>
                Conversación guardada el: {selectedConversation.createdAt ? format(new Date(selectedConversation.createdAt), 'dd MMMM yyyy, HH:mm', { locale: es }) : 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow p-1 pr-3 -mx-1">
              <div className="space-y-4 py-2 px-1">
              {selectedConversation.messages.map((message, index) => (
                <div
                  key={`${selectedConversation.id}-msg-${index}`}
                  className={cn(
                    "flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]",
                    message.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {message.sender === 'ai' ? (
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={cn(
                      "p-2.5 rounded-xl shadow-sm text-sm",
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-secondary text-secondary-foreground rounded-bl-none'
                    )}
                  >
                    {message.imageUrl && (
                      <div className="mb-2 relative w-full max-w-[200px] sm:max-w-[250px] aspect-square bg-muted rounded-md overflow-hidden">
                        <NextImage
                          src={message.imageUrl}
                          alt="Adjunto en conversación guardada"
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md"
                          data-ai-hint="user image"
                        />
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              ))}
              </div>
            </ScrollArea>
            <DialogClose asChild>
                <Button type="button" variant="outline" className="mt-4 self-end">Cerrar</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


    