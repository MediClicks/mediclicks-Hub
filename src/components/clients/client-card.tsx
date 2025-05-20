
'use client';

import Image from 'next/image';
import React, { useState } from 'react'; // Import useState
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Client, WithConvertedDates } from "@/types"; 
import { Briefcase, CalendarDays, Mail, Phone, Building, Edit, Trash2 } from 'lucide-react';
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

interface ClientCardProps {
  client: WithConvertedDates<Client>;
  onClientDeleted: (clientId: string) => void; // Callback to update parent state
}

export function ClientCard({ client, onClientDeleted }: ClientCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (dateInput: Date | string | undefined) => {
    if (!dateInput) return 'N/A';
    try {
      return new Date(dateInput).toLocaleDateString('es-ES');
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const getYear = (dateInput: Date | string | undefined) => {
    if (!dateInput) return '';
    try {
      return new Date(dateInput).getFullYear();
    } catch (e) {
      return '';
    }
  }

  const handleDeleteClient = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "clients", client.id));
      toast({
        title: "Cliente Eliminado",
        description: `El cliente ${client.name} ha sido eliminado correctamente.`,
      });
      onClientDeleted(client.id); // Notify parent to update UI
    } catch (error) {
      console.error("Error eliminando cliente: ", error);
      toast({
        title: "Error al Eliminar",
        description: "No se pudo eliminar el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-start gap-4 p-4 bg-secondary/30">
          <Avatar className="h-16 w-16 border-2 border-primary">
            {client.avatarUrl ? (
              <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="company logo" />
            ) : (
              <AvatarFallback>{client.name ? client.name.substring(0, 2).toUpperCase() : 'CL'}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{client.name}</CardTitle>
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
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
              <Briefcase className="mr-2 h-4 w-4" /> Servicios Activos Generales
            </h4>
             <p className="text-xs text-foreground line-clamp-2">{client.serviciosActivosGeneral || 'No especificado'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
                <CalendarDays className="mr-1 h-3 w-3" /> Inicio Contrato
              </h4>
              <p>{formatDate(client.contractStartDate)}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
                <CalendarDays className="mr-1 h-3 w-3" /> Próx. Factura
              </h4>
              <p>{formatDate(client.nextBillingDate)}</p>
            </div>
          </div>

          {client.dominioWeb && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-0.5">Dominio Web</h4>
              <p className="text-sm">{client.dominioWeb}</p>
              {client.vencimientoWeb && <p className="text-xs text-muted-foreground">Vence: {formatDate(client.vencimientoWeb)}</p>}
            </div>
          )}
        
        </CardContent>
        <CardFooter className="p-4 border-t flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" asChild disabled>
              {/* TODO: Implementar link a página de edición */}
              <Link href={`/clients/${client.id}/edit`}> 
                <Edit className="h-4 w-4" />
                <span className="sr-only">Editar Cliente</span>
              </Link>
            </Button>
            <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Eliminar Cliente</span>
            </Button>
          </div>
          {typeof client.pagado !== 'undefined' && (
              <Badge variant={client.pagado ? "default" : "destructive"} className="text-xs px-1.5 py-0.5 bg-opacity-70">
                  {client.pagado ? "Al día" : "Pago Pendiente"}
              </Badge>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente "{client.name}" y todos sus datos asociados (futuras tareas y facturas podrían quedar sin cliente asociado).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? "Eliminando..." : "Sí, eliminar cliente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
