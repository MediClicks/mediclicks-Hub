
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, Users, Zap, Briefcase, Brain, Lightbulb, MessageSquare, Clock, List, TrendingUp, ShieldCheck, FileText, Cog, BookOpen, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import type { SavedConversation, WithConvertedDates } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils"; // Assuming cn is imported from lib/utils
import type { ClassValue } from "clsx"; // Import ClassValue if not globally available

interface CapabilityCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  status?: "Próximamente" | "En Desarrollo";
}

const CapabilityCard: React.FC<CapabilityCardProps> = ({ icon: Icon, title, description, status = "Próximamente" }) => (
  <Card className="bg-card hover:shadow-lg transition-shadow duration-300 border-l-4 border-primary/30 flex flex-col">
    <CardHeader className="pb-3 pt-4 px-4">
      <div className="flex justify-between items-start mb-1">
        <CardTitle className="text-base font-semibold flex items-center text-foreground">
          <Icon className="mr-2 h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <Badge variant="outline" className={cn("text-xs", status === "En Desarrollo" ? "border-amber-500 text-amber-600" : "border-accent text-accent")}>{status}</Badge>
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
  const [savedConversations, setSavedConversations] = useState<WithConvertedDates<SavedConversation>[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { user } = useAuth();

  const fetchSavedConversations = useCallback(async () => {
    if (!user || !user.uid) {
      setSavedConversations([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const q = query(
        collection(db, "savedConversations"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedConversations = querySnapshot.docs.map(doc => {
        const data = doc.data() as Omit<SavedConversation, 'id'>; 
        const convertedData = {} as Partial<WithConvertedDates<SavedConversation>>;
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key as keyof typeof data];
            if (value instanceof Timestamp) {
              (convertedData[key as keyof SavedConversation] as any) = value.toDate();
            } else {
              (convertedData[key as keyof SavedConversation] as any) = value;
            }
          }
        }
        return { id: doc.id, ...convertedData } as WithConvertedDates<SavedConversation>;
      });
      setSavedConversations(fetchedConversations);
    } catch (error) {
      console.error("Error fetching saved conversations:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedConversations();
  }, [fetchSavedConversations]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Bot className="mr-3 h-8 w-8 text-primary" />
          Medi Clicks AI Agency
        </h1>
      </div>
      
      <Card className="lg:col-span-3 shadow-xl border-t-4 border-primary">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
             <Zap className="mr-2 h-6 w-6 text-primary" />
            Capacidades de Il Dottore
          </CardTitle>
          <CardDescription>
            Il Dottore es tu asistente IA personal. Puedes interactuar con él directamente desde el Panel Principal. 
            Aquí puedes explorar sus capacidades actuales y futuras.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CapabilityCard 
                    icon={MessageSquare} 
                    title="Asistencia Conversacional" 
                    description="Il Dottore puede responder preguntas, resumir información, y ayudarte a analizar datos básicos de la agencia como el número de clientes o tareas próximas. Disponible en el Panel Principal." 
                    status="En Desarrollo"
                />
                 <CapabilityCard 
                    icon={Lightbulb} 
                    title="Brainstorming Creativo" 
                    description="Ayuda a generar ideas para nuevas campañas, slogans, ángulos de contenido para redes sociales o estrategias de marketing para tus clientes." 
                />
                <CapabilityCard 
                    icon={FileText} 
                    title="Asistencia en Redacción" 
                    description="Generación de borradores para correos electrónicos, propuestas básicas, descripciones de servicios o publicaciones cortas para redes sociales." 
                />
                <CapabilityCard 
                    icon={BarChart3} 
                    title="Análisis Básico de Datos" 
                    description="Capacidad para interpretar datos simples que le proporciones (ej. de una imagen de un gráfico) y ofrecer resúmenes o insights." 
                    status="En Desarrollo"
                />
                 <CapabilityCard 
                    icon={Cog} 
                    title="Optimización de Contenido SEO" 
                    description="Sugerencias para mejorar el contenido existente, identificar palabras clave relevantes y optimizar textos para motores de búsqueda." 
                />
                <CapabilityCard 
                    icon={ShieldCheck} 
                    title="Análisis de Sentimiento" 
                    description="Analiza comunicaciones (ej. emails, reseñas) para identificar el sentimiento general y posibles puntos de mejora en la relación con clientes." 
                />
            </div>
             <div className="border-t border-border pt-8 mt-8">
                <h3 className="text-xl font-semibold mb-6 text-center text-primary flex items-center justify-center gap-2">
                  <Zap className="h-6 w-6 text-primary/90"/>
                  Próximas Capacidades Avanzadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CapabilityCard 
                    icon={Users} 
                    title="Gestión Inteligente de Equipo" 
                    description="Asistencia en la asignación de tareas basada en habilidades y carga de trabajo, seguimiento de rendimiento del equipo y optimización de recursos." 
                  />
                  <CapabilityCard 
                    icon={Briefcase} 
                    title="Analíticas Predictivas de Agencia" 
                    description="Análisis avanzados y predicciones sobre KPIs, rentabilidad de proyectos, y tendencias del mercado para la toma de decisiones estratégicas." 
                  />
                  <CapabilityCard 
                    icon={Brain} 
                    title="Base de Conocimiento Dinámica" 
                    description="Il Dottore aprenderá de tus documentos, procesos y mejores prácticas para ofrecer respuestas y soluciones personalizadas y consistentes para la agencia." 
                  />
                   <CapabilityCard 
                    icon={BookOpen} 
                    title="Biblioteca de Recursos Inteligente" 
                    description="Il Dottore gestionará y te ayudará a encontrar rápidamente documentación interna, plantillas, guías de estilo y procesos operativos." 
                  />
                   <CapabilityCard 
                    icon={FileText} 
                    title="Gestión Avanzada de Propuestas" 
                    description="Asistencia completa en la creación, personalización, seguimiento y gestión de propuestas comerciales complejas para clientes potenciales." 
                  />
                </div>
              </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 shadow-xl border-t-4 border-accent mt-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <List className="mr-2 h-6 w-6 text-accent" />
            Historial de Conversaciones con Il Dottore
          </CardTitle>
          <CardDescription>Revisa tus interacciones guardadas.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="ml-2 text-sm text-muted-foreground">Cargando historial...</p>
            </div>
          ) : savedConversations.length > 0 ? (
            <ScrollArea className="h-[300px] pr-3">
              <ul className="space-y-2">
                {savedConversations.map((convo) => (
                  <li key={convo.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <button 
                      className="w-full text-left focus:outline-none"
                      title="Cargar esta conversación (funcionalidad próximamente)"
                      disabled 
                    >
                      <p className="text-sm font-medium text-primary truncate" title={convo.title}>
                        {convo.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Guardada: {convo.createdAt ? format(new Date(convo.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Fecha N/A'}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No hay conversaciones guardadas con Il Dottore.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
