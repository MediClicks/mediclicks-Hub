
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, Users, Zap, Briefcase, Brain, Lightbulb, MessageSquare, Clock, List } from "lucide-react";
import { Chatbot } from "@/components/ai-agency/chatbot";
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

// Helper function to convert Firestore Timestamps
function convertConversationTimestamps(docData: any): WithConvertedDates<SavedConversation> {
  const data = { ...docData } as Partial<WithConvertedDates<SavedConversation>>;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key as keyof SavedConversation];
      if (value instanceof Timestamp) {
        (data[key as keyof SavedConversation] as any) = value.toDate();
      }
    }
  }
  return data as WithConvertedDates<SavedConversation>;
}


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
        const data = convertConversationTimestamps(doc.data() as SavedConversation);
        return { id: doc.id, ...data };
      });
      setSavedConversations(fetchedConversations);
    } catch (error) {
      console.error("Error fetching saved conversations:", error);
      // Consider showing a toast to the user
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2 shadow-xl border-t-4 border-primary">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <MessageSquare className="mr-2 h-6 w-6 text-primary" />
              MC Agent
            </CardTitle>
            <CardDescription>
              Tu asistente IA personal. Haz preguntas, pide resúmenes o envía imágenes para análisis.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-1 md:p-2">
            <Chatbot onConversationSaved={fetchSavedConversations} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-xl border-t-4 border-accent">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <List className="mr-2 h-6 w-6 text-accent" />
              Historial de Conversaciones
            </CardTitle>
            <CardDescription>Revisa tus interacciones guardadas con MC Agent.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="ml-2 text-sm text-muted-foreground">Cargando historial...</p>
              </div>
            ) : savedConversations.length > 0 ? (
              <ScrollArea className="h-[300px] pr-3"> {/* Max height for scrollability */}
                <ul className="space-y-2">
                  {savedConversations.map((convo) => (
                    <li key={convo.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                      <button 
                        // onClick={() => console.log("Load conversation:", convo.id)} // Placeholder for loading convo
                        className="w-full text-left focus:outline-none"
                        title="Cargar esta conversación (funcionalidad próximamente)"
                        disabled // Deshabilitado hasta implementar carga
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
              <p className="text-sm text-muted-foreground text-center py-8">No hay conversaciones guardadas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="border-t border-border pt-8 mt-8">
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
            icon={Briefcase} // Cambiado de TrendingUp a Briefcase
            title="Analíticas Predictivas de Agencia" 
            description="Análisis avanzados y predicciones sobre KPIs, rentabilidad de proyectos, y tendencias del mercado para la toma de decisiones estratégicas." 
          />
          <CapabilityCard 
            icon={Brain} 
            title="Base de Conocimiento Dinámica" 
            description="MC Agent aprenderá de tus documentos, procesos y mejores prácticas para ofrecer respuestas y soluciones personalizadas para la agencia." 
          />
        </div>
      </div>
    </div>
  );
}
