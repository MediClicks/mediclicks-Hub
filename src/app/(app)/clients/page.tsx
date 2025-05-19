
'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { ClientCard } from "@/components/clients/client-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Client, WithConvertedDates } from '@/types';

// Function to convert Firestore Timestamps to JS Date objects
function convertTimestampsToDates(docData: any): any {
  const data = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate();
    }
  }
  return data;
}


export default function ClientsPage() {
  const [clients, setClients] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const clientsCollection = collection(db, "clients");
        const q = query(clientsCollection, orderBy("createdAt", "desc")); // Order by creation date
        const querySnapshot = await getDocs(q);
        const clientsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure all date fields from Firestore (Timestamps) are converted to JS Date objects
          const convertedData = convertTimestampsToDates(data);
          return { id: doc.id, ...convertedData } as WithConvertedDates<Client>;
        });
        setClients(clientsData);
      } catch (err) {
        console.error("Error fetching clients: ", err);
        setError("No se pudieron cargar los clientes. Intenta de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <Button asChild>
          <Link href="/clients/add">
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Nuevo Cliente
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
        <div className="text-center py-12 text-destructive">
          <p className="text-lg">{error}</p>
        </div>
      )}

      {!isLoading && !error && clients.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {clients.map(client => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
      
      {!isLoading && !error && clients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No se encontraron clientes.</p>
          <Button variant="link" className="mt-2" asChild>
            <Link href="/clients/add">Agrega tu primer cliente</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
