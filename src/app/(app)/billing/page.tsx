
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Button, buttonVariants } from "@/components/ui/button";
import type { Invoice, InvoiceStatus, WithConvertedDates, Client, AgencyDetails } from "@/types";
import { PlusCircle, Download, Eye, Edit2, Loader2, Receipt, AlertTriangle, Trash2 } from "lucide-react"; // Removed Filter, UserCircle, CalendarIconLucide, X
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore'; // Removed where, QueryConstraint
import { cn } from '@/lib/utils';
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
// Removed DropdownMenu imports
// Removed Popover and Calendar imports
// Removed format, startOfDay, endOfDay from date-fns
// Removed DateRange type

const statusColors: Record<InvoiceStatus, string> = {
  Pagada: "bg-green-500 border-green-600 hover:bg-green-600 text-white",
  "No Pagada": "bg-yellow-500 border-yellow-600 hover:bg-yellow-600 text-white",
  Vencida: "bg-red-500 border-red-600 hover:bg-red-600 text-white",
};

function convertFirestoreTimestamps<T extends Record<string, any>>(docData: any): WithConvertedDates<T> {
  if (!docData) return docData as WithConvertedDates<T>;
  const data = { ...docData } as Partial<WithConvertedDates<T>>;
  for (const key in data) {
    if (data[key as keyof T] instanceof Timestamp) {
      data[key as keyof T] = (data[key as keyof T] as Timestamp).toDate() as any;
    } else if (Array.isArray(data[key as keyof T])) {
      (data[key as keyof T] as any) = (data[key as keyof T] as any[]).map(item =>
        typeof item === 'object' && item !== null && !(item instanceof Date) ? convertFirestoreTimestamps(item) : item
      );
    } else if (typeof data[key as keyof T] === 'object' && data[key as keyof T] !== null && !((data[key as keyof T]) instanceof Date)) {
      (data[key as keyof T] as any) = convertFirestoreTimestamps(data[key as keyof T] as any);
    }
  }
  return data as WithConvertedDates<T>;
}

// Removed filter type definitions

export default function BillingPage() {
  const [invoices, setInvoices] = useState<WithConvertedDates<Invoice>[]>([]);
  // const [clientsForFilter, setClientsForFilter] = useState<WithConvertedDates<Client>[]>([]); // Removed as client filter is removed
  // const [agencyDetails, setAgencyDetails] = useState<AgencyDetails | null>(null); 
  // const [isClientSide, setIsClientSide] = useState(false); 

  const [isLoading, setIsLoading] = useState(true);
  // const [isLoadingClients, setIsLoadingClients] = useState(true); // Removed
  // const [isLoadingAgency, setIsLoadingAgency] = useState(true); 

  const [error, setError] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<WithConvertedDates<Invoice> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Removed filter state variables: statusFilter, clientFilter, dateRangeFilter
  
  // useEffect(() => { 
  //   setIsClientSide(true);
  // }, []);

  // Simplified fetchInitialData as client list for filter is no longer needed
  // const fetchInitialData = useCallback(async () => {
    // Logic for agencyDetails could be kept if needed elsewhere, but not for filters
  // }, [toast]);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const invoicesCollection = collection(db, "invoices");
      // Simplified query: only orderBy issuedDate
      const q = query(invoicesCollection, orderBy("issuedDate", "desc"));
      
      const querySnapshot = await getDocs(q);
      const invoicesData = querySnapshot.docs.map(doc => {
        const data = convertFirestoreTimestamps<Invoice>(doc.data() as Invoice);
        return { id: doc.id, ...data };
      });
      setInvoices(invoicesData);
    } catch (err: any) {
      console.error("Error fetching invoices: ", err);
      if (err.message && (err.message.includes("index") || err.message.includes("Index")) ) {
        setError(`Se requiere un índice de Firestore para esta consulta. Por favor, créalo usando el enlace en la consola de errores del navegador y luego recarga la página. (${err.message})`);
      } else {
        setError("No se pudieron cargar las facturas. Intenta de nuevo más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed filter states from dependencies

  // useEffect(() => { // Simplified initial data fetching
  //   fetchInitialData(); 
  // }, [fetchInitialData]);

  useEffect(() => {
    // if (!isLoadingClients /* && !isLoadingAgency */) { 
    fetchInvoices();
    // }
  }, [fetchInvoices]); // Removed isLoadingClients


  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "invoices", invoiceToDelete.id));
      toast({
        title: "Factura Eliminada",
        description: `La factura con ID ${invoiceToDelete.id.substring(0, 8).toUpperCase()} ha sido eliminada.`,
      });
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoiceToDelete.id));
    } catch (error) {
      console.error("Error eliminando factura: ", error);
      toast({
        title: "Error al Eliminar",
        description: "No se pudo eliminar la factura. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setInvoiceToDelete(null);
    }
  };

  // Removed clearAllFilters function
  
  const getEmptyStateMessage = () => {
    return "No se encontraron facturas.";
  };

  // Removed currentFilteredClientName

  const isLoadingOverall = isLoading; // Simplified as isLoadingClients is removed
  
  // Removed activeFiltersCount


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Facturación y Cobros</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Removed all Filter DropdownMenus and Popover */}
          {/* Removed Clear All Filters Button */}
          <Button asChild>
            <Link href="/billing/add">
              <PlusCircle className="mr-2 h-4 w-4 text-primary-foreground" /> Crear Nueva Factura
            </Link>
          </Button>
        </div>
      </div>

      {isLoadingOverall && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Cargando datos...</p>
        </div>
      )}

      {error && !isLoadingOverall && (
        <div className="text-center py-12 text-destructive bg-destructive/10 p-4 rounded-md whitespace-pre-wrap">
          <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-destructive" />
          <p className="text-lg">{error}</p>
          <Button variant="link" onClick={fetchInvoices} className="mt-2">Reintentar Carga</Button>
        </div>
      )}

      {!isLoadingOverall && !error && invoices.length > 0 && (
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
              {invoices.map(invoice => {
                // PDF Download Link logic is commented out / simplified as per previous steps
                return (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                       <Link href={`/billing/${invoice.id}/view`} className="hover:underline text-primary">
                        {invoice.id.substring(0, 8).toUpperCase()}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.clientName || 'N/A'}</TableCell>
                    <TableCell>{(invoice.totalAmount || 0).toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
                    <TableCell>{invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                    <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={cn("border text-xs", statusColors[invoice.status])}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="hover:text-primary h-8 w-8" title="Ver Factura" asChild>
                        <Link href={`/billing/${invoice.id}/view`}>
                          <Eye className="h-4 w-4 text-sky-600" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-yellow-500 h-8 w-8" title="Editar Factura" asChild>
                        <Link href={`/billing/${invoice.id}/edit`}>
                          <Edit2 className="h-4 w-4 text-yellow-600" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive h-8 w-8"
                        title="Eliminar Factura"
                        onClick={() => setInvoiceToDelete(invoice)}
                        disabled={isDeleting && invoiceToDelete?.id === invoice.id}
                       >
                        {isDeleting && invoiceToDelete?.id === invoice.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-600" />}
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 cursor-not-allowed" title="Descargar PDF (deshabilitado en lista)" disabled>
                          <Download className="h-4 w-4 text-blue-600 opacity-50" />
                       </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoadingOverall && !error && invoices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-lg">{getEmptyStateMessage()}</p>
          {/* Removed condition for filters to show "Crea tu primera factura" */}
          <Button variant="link" className="mt-2" asChild>
            <Link href="/billing/add">Crea tu primera factura</Link>
          </Button>
        </div>
      )}

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => {if(!isDeleting && !open) setInvoiceToDelete(null)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la factura con ID {invoiceToDelete?.id.substring(0, 8).toUpperCase()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setInvoiceToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              disabled={isDeleting}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, eliminar factura"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
