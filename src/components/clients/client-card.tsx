
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Client, WithConvertedDates } from "@/types";
import { CalendarDays, Mail, Phone, Building, Edit, Trash2, CheckCircle, XCircle, Loader2, UserCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ClientCardProps {
  client: WithConvertedDates<Client>;
  onClientDeleted: (clientId: string) => void;
}

export function ClientCard({ client, onClientDeleted }: ClientCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (dateInput: Date | string | undefined | null) => {
    if (!dateInput) return 'N/A';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (date instanceof Date && !isNaN(date.valueOf())) {
        return date.toLocaleDateString('es-ES');
      }
      return 'Fecha inválida';
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const handleDeleteClient = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "clients", client.id));
      toast({
        title: "Cliente Eliminado",
        description: `El cliente ${client.name} ha sido eliminado correctamente. Las tareas y facturas asociadas no se eliminan automáticamente.`,
      });
      onClientDeleted(client.id);
      setShowDeleteDialog(false); 
    } catch (error) {
      console.error("Error eliminando cliente: ", error);
      toast({
        title: "Error al Eliminar",
        description: "No se pudo eliminar el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col bg-card">
        <CardHeader className="flex flex-row items-start gap-4 p-4 bg-card-foreground/5">
          <Avatar className="h-16 w-16 border-2 border-primary">
            {client.avatarUrl ? (
              <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="company logo" />
            ) : (
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">{client.name ? client.name.substring(0, 2).toUpperCase() : 'CL'}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-xl mb-1 text-foreground">
              <Link href={`/clients/${client.id}/edit`} className="hover:underline text-primary">
                {client.name}
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center text-sm mb-1">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> {client.email}
            </CardDescription>
            {client.telefono && (
              <CardDescription className="flex items-center text-sm mb-1">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" /> {client.telefono}
              </CardDescription>
            )}
            {client.clinica && (
              <CardDescription className="flex items-center text-sm">
                <Building className="mr-2 h-4 w-4 text-muted-foreground" /> {client.clinica}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3 flex-grow">
          
          {client.profileSummary && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <UserCircle className="mr-2 h-4 w-4 text-primary" /> Resumen del Perfil
              </h4>
              <p className="text-xs text-foreground line-clamp-2">{client.profileSummary}</p>
            </div>
          )}

           {(client.contractedServices && client.contractedServices.length > 0) && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><path d="M20 12H4"/></svg>
                 Servicios Contratados ({client.contractedServices.length})
              </h4>
              <p className="text-xs text-foreground line-clamp-2">
                {client.contractedServices.map(s => s.serviceName).join(', ') || 'No especificado'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
                <CalendarDays className="mr-1 h-3 w-3 text-primary/80" /> Inicio Contrato
              </h4>
              <p>{formatDate(client.contractStartDate)}</p>
            </div>
          </div>

          {client.dominioWeb && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-0.5 flex items-center">
                 <Globe className="mr-2 h-4 w-4 text-primary" /> Dominio Web
              </h4>
              <p className="text-sm">{client.dominioWeb}</p>
              {client.vencimientoWeb && <p className="text-xs text-muted-foreground">Vence: {formatDate(client.vencimientoWeb)}</p>}
            </div>
          )}

        </CardContent>
        <CardFooter className="p-4 border-t flex justify-between items-center bg-card-foreground/5">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-yellow-400/20 hover:border-yellow-500" asChild>
              <Link href={`/clients/${client.id}/edit`}>
                <Edit className="h-4 w-4 text-yellow-600" />
                <span className="sr-only">Editar Cliente</span>
              </Link>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-400/20 hover:border-red-500" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-600" />}
              <span className="sr-only">Eliminar Cliente</span>
            </Button>
          </div>
          {typeof client.pagado !== 'undefined' && (
              <Badge
                variant={client.pagado ? "default" : "destructive"}
                className={cn(
                  "text-xs px-2 py-1 flex items-center",
                  client.pagado ? "bg-green-500 border-green-600 text-white" : "bg-red-500 border-red-600 text-white"
                )}
              >
                {client.pagado ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                {client.pagado ? "Al día" : "Pago Pendiente"}
              </Badge>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {if(!isDeleting && !open) setShowDeleteDialog(open)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente "{client.name}". Las tareas y facturas asociadas a este cliente no se eliminarán automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setShowDeleteDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, eliminar cliente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
