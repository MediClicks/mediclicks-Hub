
'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Invoice, InvoiceStatus, WithConvertedDates } from "@/types";
import { PlusCircle, Download, Eye, Edit2, Loader2 } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

const statusColors: Record<InvoiceStatus, string> = {
  Pagada: "bg-green-500 hover:bg-green-600",
  "No Pagada": "bg-yellow-500 hover:bg-yellow-600",
  Vencida: "bg-red-500 hover:bg-red-600",
};

// Function to convert Firestore Timestamps to JS Date objects
function convertTimestampsToDates(docData: any): any {
  const data = { ...docData };
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate();
    } else if (Array.isArray(data[key])) { // Handle arrays of objects (e.g., invoice items)
        data[key] = data[key].map(item => 
            typeof item === 'object' && item !== null && !(item instanceof Date) ? convertTimestampsToDates(item) : item
        );
    } else if (typeof data[key] === 'object' && data[key] !== null && !(data[key] instanceof Date)) { // Handle nested objects
        data[key] = convertTimestampsToDates(data[key]);
    }
  }
  return data;
}


export default function BillingPage() {
  const [invoices, setInvoices] = useState<WithConvertedDates<Invoice>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const invoicesCollection = collection(db, "invoices");
        const q = query(invoicesCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const invoicesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure all date fields from Firestore (Timestamps) are converted to JS Date objects
          const convertedData = convertTimestampsToDates(data);
          return { id: doc.id, ...convertedData } as WithConvertedDates<Invoice>;
        });
        setInvoices(invoicesData);
      } catch (err) {
        console.error("Error fetching invoices: ", err);
        setError("No se pudieron cargar las facturas. Intenta de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Facturación y Cobros</h1>
        <Button asChild>
          <Link href="/billing/add">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Factura
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Cargando facturas...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-12 text-destructive">
          <p className="text-lg">{error}</p>
        </div>
      )}
      
      {!isLoading && !error && invoices.length > 0 && (
        <div className="rounded-lg border shadow-sm bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Factura</TableHead>
                <TableHead>Nombre Cliente</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(invoice => (
                <TableRow key={invoice.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{invoice.id.toUpperCase()}</TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>{invoice.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
                  <TableCell>{invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                  <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[invoice.status]} text-white`}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {/* TODO: Implement View, Edit, and Download functionality */}
                    <Button variant="ghost" size="icon" className="hover:text-primary" title="Ver Factura" disabled>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-primary" title="Editar Factura" disabled>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-accent" title="Descargar PDF" disabled>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {!isLoading && !error && invoices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No se encontraron facturas.</p>
           <Button variant="link" className="mt-2" asChild>
            <Link href="/billing/add">Crea tu primera factura</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
