
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import { ClientCard } from "@/components/clients/client-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, AlertTriangle, Users, Filter, DollarSign } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, where, QueryConstraint } from 'firebase/firestore';
import type { Client, WithConvertedDates } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

function convertTimestampsToDates(docData: any): any {
  const data = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate();
    } else if (typeof data[key] === 'object' && data[key] !== null && !(data[key] instanceof Date) && !Array.isArray(data[key])) {
        data[key] = convertTimestampsToDates(data[key]);
    }
  }
  return data;
}

const ALL_FILTER_VALUE = 'All';
type PaymentStatusFilterType = 'Al día' | 'Pago Pendiente' | typeof ALL_FILTER_VALUE;

const paymentStatusesForFilter: PaymentStatusFilterType[] = ['Al día', 'Pago Pendiente'];


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
      const queryConstraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

      if (paymentStatusFilter !== ALL_FILTER_VALUE) {
        const filterValue = paymentStatusFilter === 'Al día'; // true for 'Al día', false for 'Pago Pendiente'
        queryConstraints.unshift(where("pagado", "==", filterValue));
      }

      const q = query(clientsCollection, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure services is an array, even if undefined in Firestore
        const convertedData = convertTimestampsToDates(data) as Omit<Client, 'id' | 'services'> & { services?: any[] };
        
        const servicesArray = Array.isArray(convertedData.services) ? convertedData.services : [];

        return { 
          id: doc.id, 
          ...convertedData,
          services: servicesArray
        } as WithConvertedDates<Client>;
      });
      setClients(clientsData);
    } catch (err: any) {
      console.error("Error fetching clients: ", err);
       if (err.message && err.message.includes("index")) {
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

  const getEmptyStateMessage = () => {
    let message = "No se encontraron clientes";
    if (paymentStatusFilter !== ALL_FILTER_VALUE) {
      message += ` con estado de pago "${paymentStatusFilter}".`;
    } else {
      message += ".";
    }
    return message;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                {paymentStatusFilter === ALL_FILTER_VALUE ? "Filtrar por Estado de Pago" : `Pago: ${paymentStatusFilter}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Seleccionar Estado de Pago</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={paymentStatusFilter} onValueChange={(value) => setPaymentStatusFilter(value as PaymentStatusFilterType)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todos</DropdownMenuRadioItem>
                {paymentStatusesForFilter.map(status => (
                  <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
