
'use client';

import React, { useState, useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Client, WithConvertedDates, ContractedServiceClient } from "@/types";
import { CalendarDays, Mail, Phone, Building, Edit, Trash2, CheckCircle, XCircle, Loader2, UserCircle, Globe, Briefcase, Info } from 'lucide-react';
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";import {
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
import { updateUserProfileIcon } from '@/app/actions/clientActions';

interface ClientCardProps {
  client: WithConvertedDates<Client>;
  onClientDeleted: (clientId: string) => void;
}

export function ClientCard({ client, onClientDeleted }: ClientCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const personIcons = [
    <svg key="icon1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>, // Simple person
    <svg key="icon2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="7" r="4" />
      <path d="M19.25 17.25a7 7 0 0 0-14.5 0" />
      <path d="M15 11l1.5-1.5M9 11l-1.5-1.5" />
      <path d="M12 15v2" />
    </svg>, // Person with styled hair
    <svg key="icon3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="7" r="4" />
      <path d="M17.5 16.5a7 7 0 0 0-11 0" />
      <rect x="8" y="9" width="8" height="3" rx="1" ry="1" />
    </svg>, // Person with glasses
    <svg key="icon4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>, // Two people (simplified)
    <svg key="icon5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="6" r="4" />
      <path d="M12 11v5" />
      <path d="M8 21h8" />
      <path d="M12 16v6" />
      <path d="M10 13l-2 8" />
      <path d="M14 13l2 8" />
    </svg>, // Person with a hat
  ];

  const handleIconSelect = async (iconSvg: string) => {
    if (client && client.id) {
      await updateUserProfileIcon(client.id, iconSvg);
    }
  };

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

  const handleDeleteClient = useCallback(async () => {
    if (!client || !client.id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "clients", client.id));
      toast({
        title: "Cliente Eliminado",
        description: `El cliente ${client.name} ha sido eliminado correctamente. Las tareas y facturas asociadas a este cliente no se eliminan automáticamente.`,
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
  }, [client, onClientDeleted, toast]);

  const getAvatarFallbackText = (name: string | undefined): string => {
    if (!name || name.trim() === '') return 'CL';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words.length === 1 && words[0].length >= 2) {
      return words[0].substring(0, 2).toUpperCase();
    }
    if (words.length === 1 && words[0].length === 1) {
        return words[0].toUpperCase();
    }
    return 'CL';
  };

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col bg-card">
        <CardHeader className="flex flex-row items-start gap-4 p-4 bg-card-foreground/5 relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-16 w-16 border-2 border-primary cursor-pointer">
                {client.profileIcon ? (
                  <div dangerouslySetInnerHTML={{ __html: client.profileIcon }} className="h-full w-full flex items-center justify-center text-primary" />
                ) : (
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold text-lg flex items-center justify-center">
                    <UserCircle className="h-10 w-10" /> {/* Default random icon */}
                  </AvatarFallback>
                )}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {personIcons.map((icon, index) => (
                <DropdownMenuItem key={index} onClick={() => handleIconSelect(ReactDOMServer.renderToString(icon))} className="cursor-pointer">
                  {icon} Icono {index + 1}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1">
            <CardTitle className="text-xl mb-1 text-foreground">
              <Link href={`/clients/${client.id}/edit`} className="hover:underline text-primary">
                {client.name || "Nombre no disponible"}
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center text-sm mb-1">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> {client.email || "Email no disponible"}
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
                <Info className="mr-2 h-4 w-4 text-primary" /> Resumen del Perfil
              </h4>
              <p className="text-xs text-foreground line-clamp-2">{client.profileSummary}</p>
            </div>
          )}

           {(Array.isArray(client.contractedServices) && client.contractedServices.length > 0) && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <Briefcase className="mr-2 h-4 w-4 text-primary"/>
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
            <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-yellow-400/20 hover:border-yellow-500" asChild title="Editar Cliente">
              <Link href={`/clients/${client.id}/edit`}>
                <Edit className="h-4 w-4 text-yellow-600" />
                <span className="sr-only">Editar Cliente</span>
              </Link>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-400/20 hover:border-red-500" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting} title="Eliminar Cliente">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-600" />}
              <span className="sr-only">Eliminar Cliente</span>
            </Button>
          </div>
          {typeof client.pagado !== 'undefined' && (
              <Badge
                className={cn(
                  "text-xs px-2 py-1 flex items-center",
                  client.pagado ? "bg-green-500 border-green-600 text-white hover:bg-green-600" : "bg-red-500 border-red-600 text-white hover:bg-red-600"
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
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, eliminar cliente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
