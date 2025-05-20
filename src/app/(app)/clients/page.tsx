
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import { ClientCard } from "@/components/clients/client-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, AlertTriangle, Users } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Client, WithConvertedDates } from '@/types';

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

export default function ClientsPage() {
  const [clients, setClients] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const clientsCollection = collection(db, "clients");
      const q = query(clientsCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
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
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleClientDeleted = (deletedClientId: string) => {
    setClients(prevClients => prevClients.filter(client => client.id !== deletedClientId));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <Button asChild>
          <Link href="/clients/add">
            <PlusCircle className="mr-2 h-4 w-4 text-primary-foreground" /> Agregar Nuevo Cliente
          </Link>
        </Button>
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
          <p className="text-lg">No se encontraron clientes.</p>
          <Button variant="link" className="mt-2" asChild>
            <Link href="/clients/add">Agrega tu primer cliente</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

