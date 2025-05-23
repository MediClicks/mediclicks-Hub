
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import { ClientCard } from "@/components/clients/client-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, AlertTriangle, Users, Filter, X } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, where, type QueryConstraint } from 'firebase/firestore';
import type { Client, WithConvertedDates } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function convertTimestampsToDates(docData: any): WithConvertedDates<Client> {
  const data = { ...docData } as Partial<WithConvertedDates<Client>>;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key as keyof Client];
      if (value instanceof Timestamp) {
        data[key as keyof Client] = value.toDate() as any;
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date) && !Array.isArray(value)) {
          data[key as keyof Client] = convertTimestampsToDates(value) as any;
      } else if (Array.isArray(value)) {
        (data[key as keyof Client] as any) = value.map(item =>
          typeof item === 'object' && item !== null && !(item instanceof Date) ? convertTimestampsToDates(item) : item
        );
      }
    }
  }
  // Ensure contractedServices and socialMediaAccounts are arrays
  if (data.contractedServices && !Array.isArray(data.contractedServices)) {
    data.contractedServices = [];
  } else if (!data.contractedServices) {
    data.contractedServices = [];
  }

  if (data.socialMediaAccounts && !Array.isArray(data.socialMediaAccounts)) {
    data.socialMediaAccounts = [];
  } else if (!data.socialMediaAccounts) {
    data.socialMediaAccounts = [];
  }
  return data as WithConvertedDates<Client>;
}

const ALL_FILTER_VALUE = "__ALL__";
type PaymentStatusFilterType = typeof ALL_FILTER_VALUE | 'paid' | 'pending';

export default function ClientsPage() {
  const [clients, setClients] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilterType>(ALL_FILTER_VALUE);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const clientsCollection = collection(db, "clients");
      let qConstraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

      if (paymentStatusFilter !== ALL_FILTER_VALUE) {
        qConstraints.push(where("pagado", "==", paymentStatusFilter === 'paid'));
      }
      
      const q = query(clientsCollection, ...qConstraints);
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const convertedData = convertTimestampsToDates(data as Client);
        return { id: doc.id, ...convertedData };
      });
      setClients(clientsData);
    } catch (err: any) {
      console.error("Error fetching clients: ", err);
       if (err.message && (err.message.includes("index") || err.message.includes("Index"))) {
        setError(`Se requiere un índice de Firestore para esta consulta. Por favor, créalo usando el enlace en la consola de errores del navegador y luego recarga la página. (${err.message})`);
      } else {
        setError("No se pudieron cargar los clientes. Intenta de nuevo más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [paymentStatusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleClientDeleted = (deletedClientId: string) => {
    setClients(prevClients => prevClients.filter(client => client.id !== deletedClientId));
  };
  
  const clearPaymentFilter = () => {
    setPaymentStatusFilter(ALL_FILTER_VALUE);
  };

  const getEmptyStateMessage = () => {
    if (paymentStatusFilter !== ALL_FILTER_VALUE) {
      return `No se encontraron clientes con estado de pago "${paymentStatusFilter === 'paid' ? 'Al día' : 'Pendiente'}".`;
    }
    return "No hay clientes registrados. ¡Agrega el primero!";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={paymentStatusFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"} className="gap-1.5">
                <Filter className="h-4 w-4" />
                {paymentStatusFilter === ALL_FILTER_VALUE ? "Estado de Pago" : 
                 paymentStatusFilter === 'paid' ? "Pago: Al día" : "Pago: Pendiente"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por Estado de Pago</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={paymentStatusFilter} onValueChange={(value) => setPaymentStatusFilter(value as PaymentStatusFilterType)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="paid">Al día</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">Pago Pendiente</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {paymentStatusFilter !== ALL_FILTER_VALUE && (
            <Button variant="ghost" onClick={clearPaymentFilter} className="text-muted-foreground hover:text-foreground gap-1.5" title="Limpiar Filtro">
              <X className="h-4 w-4" /> Limpiar Filtro
            </Button>
          )}

          <Button asChild>
            <Link href="/clients/add">
              <PlusCircle className="mr-2 h-4 w-4 text-primary-foreground" /> Agregar Nuevo Cliente
            </Link>
          </Button>
        </div>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Cargando clientes...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-12 text-destructive bg-destructive/10 p-4 rounded-md whitespace-pre-wrap">
          <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-destructive" />
          <p className="text-lg">{error}</p>
          <Button variant="link" onClick={fetchClients} className="mt-2">Reintentar Carga</Button>
        </div>
      )}

      {!isLoading && !error && clients.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {clients.map(client => (
            <ClientCard key={client.id} client={client} onClientDeleted={handleClientDeleted} />
          ))}
        </div>
      )}
      
      {!isLoading && !error && clients.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-lg">{getEmptyStateMessage()}</p>
          {paymentStatusFilter === ALL_FILTER_VALUE && (
             <Button variant="link" className="mt-2" asChild>
                <Link href="/clients/add">Agrega tu primer cliente</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

