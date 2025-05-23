
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
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
import type { Invoice, InvoiceStatus, WithConvertedDates, Client, AgencyDetails } from "@/types"; // Added AgencyDetails
import { PlusCircle, Eye, Edit2, Trash2, Filter, Loader2, Receipt, AlertTriangle, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc, where, type QueryConstraint } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast'; // Import useToast

const statusColors: Record<InvoiceStatus, string> = {
  Pagada: "bg-green-500 border-green-600 hover:bg-green-600 text-white",
  "No Pagada": "bg-yellow-500 border-yellow-600 hover:bg-yellow-600 text-white",
  Vencida: "bg-red-500 border-red-600 hover:bg-red-600 text-white",
};

const ALL_FILTER_VALUE = "__ALL__";

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


export default function BillingPage() {
  const [invoices, setInvoices] = useState<WithConvertedDates<Invoice>[]>([]);
  const [clientsList, setClientsList] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | typeof ALL_FILTER_VALUE>(ALL_FILTER_VALUE);
  const [clientFilter, setClientFilter] = useState<string | typeof ALL_FILTER_VALUE>(ALL_FILTER_VALUE);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);

  const [invoiceToDelete, setInvoiceToDelete] = useState<WithConvertedDates<Invoice> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Removed filter state variables: statusFilter, clientFilter, dateRangeFilter
  
  // useEffect(() => { 
  //   setIsClientSide(true);
  // }, []);

  const fetchInitialData = useCallback(async () => {
    setIsLoadingClients(true);
    setClientError(null);
    try {
      const clientsCollection = collection(db, "clients");
      const qClients = query(clientsCollection, orderBy("name", "asc"));
      const clientsSnapshot = await getDocs(qClients);
      const fetchedClients = clientsSnapshot.docs.map(doc => {
        const data = convertFirestoreTimestamps<Client>(doc.data() as Client);
        return { id: doc.id, ...data };
      });
      setClientsList(fetchedClients);
    } catch (err: any) {
      console.error("Error fetching clients for filter: ", err);
      setClientError("No se pudieron cargar los clientes para el filtro.");
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const invoicesCollection = collection(db, "invoices");
      let qConstraints: QueryConstraint[] = [orderBy("issuedDate", "desc")];

      if (statusFilter !== ALL_FILTER_VALUE) {
        qConstraints.push(where("status", "==", statusFilter));
      }
      if (clientFilter !== ALL_FILTER_VALUE) {
        qConstraints.push(where("clientId", "==", clientFilter));
      }
      if (dateRangeFilter?.from) {
        qConstraints.push(where("issuedDate", ">=", Timestamp.fromDate(startOfDay(dateRangeFilter.from))));
      }
      if (dateRangeFilter?.to) {
        qConstraints.push(where("issuedDate", "<=", Timestamp.fromDate(endOfDay(dateRangeFilter.to))));
      }
      
      const q = query(invoicesCollection, ...qConstraints);
      
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
  }, [statusFilter, clientFilter, dateRangeFilter]); 

  useEffect(() => { 
    fetchInitialData(); 
  }, [fetchInitialData]);

  useEffect(() => {
    if (!isLoadingClients) { 
      fetchInvoices();
    }
  }, [fetchInvoices, isLoadingClients]);


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
      setInvoiceToDelete(null);
    } catch (error) {
      console.error("Error eliminando factura: ", error);
      toast({
        title: "Error al Eliminar",
        description: "No se pudo eliminar la factura. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter(ALL_FILTER_VALUE);
    setClientFilter(ALL_FILTER_VALUE);
    setDateRangeFilter(undefined);
  };
  
  const getEmptyStateMessage = () => {
    const activeFilterCount = [statusFilter, clientFilter, dateRangeFilter?.from].filter(
      (f) => f !== ALL_FILTER_VALUE && f !== undefined
    ).length;

    if (activeFilterCount > 0) {
      let message = "No se encontraron facturas con los filtros aplicados";
      if (statusFilter !== ALL_FILTER_VALUE) message += ` (Estado: ${statusFilter})`;
      if (clientFilter !== ALL_FILTER_VALUE) {
        const clientName = clientsList.find(c => c.id === clientFilter)?.name || clientFilter;
        message += ` (Cliente: ${clientName})`;
      }
      if (dateRangeFilter?.from) {
        message += ` (Desde: ${format(dateRangeFilter.from, "dd/MM/yy", { locale: es })}${dateRangeFilter.to ? ` - Hasta: ${format(dateRangeFilter.to, "dd/MM/yy", { locale: es })}` : ''})`;
      }
      return message + ".";
    }
    return "No se encontraron facturas. ¡Crea la primera!";
  };
  
  const currentFilteredClientName = useMemo(() => {
    if (clientFilter === ALL_FILTER_VALUE || isLoadingClients) return "Cliente";
    return clientsList.find(c => c.id === clientFilter)?.name || "Cliente";
  }, [clientFilter, clientsList, isLoadingClients]);


  const isLoadingOverall = isLoading || isLoadingClients;
  
  const activeFiltersCount = [statusFilter, clientFilter, dateRangeFilter?.from].filter(
      (f) => f !== ALL_FILTER_VALUE && f !== undefined
    ).length;


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Facturación y Cobros</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={statusFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"} className="gap-1.5">
                <Filter className="h-4 w-4" />
                {statusFilter === ALL_FILTER_VALUE ? "Estado" : `Estado: ${statusFilter}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | typeof ALL_FILTER_VALUE)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todas</DropdownMenuRadioItem>
                {(['Pagada', 'No Pagada', 'Vencida'] as InvoiceStatus[]).map((status) => (
                  <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant={clientFilter !== ALL_FILTER_VALUE ? "secondary" : "outline"} className="gap-1.5" disabled={isLoadingClients}>
                <Filter className="h-4 w-4" />
                 {isLoadingClients ? "Cargando clientes..." : (clientFilter === ALL_FILTER_VALUE ? "Cliente" : `Cliente: ${currentFilteredClientName}`)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[250px]">
              <DropdownMenuLabel>Filtrar por Cliente</DropdownMenuLabel>
              <DropdownMenuSeparator />
               {isLoadingClients ? (
                <div className="p-2 text-sm text-muted-foreground">Cargando...</div>
              ) : clientError ? (
                <div className="p-2 text-sm text-destructive flex items-center"><AlertTriangle className="h-4 w-4 mr-2"/>{clientError}</div>
              ) : (
                <DropdownMenuRadioGroup value={clientFilter} onValueChange={setClientFilter}>
                  <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todos los Clientes</DropdownMenuRadioItem>
                  {clientsList.map((client) => (
                    <DropdownMenuRadioItem key={client.id} value={client.id}>{client.name}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={dateRangeFilter?.from ? "secondary" : "outline"}
                className={cn(
                  "w-auto justify-start text-left font-normal gap-1.5",
                  !dateRangeFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {dateRangeFilter?.from ? (
                  dateRangeFilter.to ? (
                    <>
                      {format(dateRangeFilter.from, "dd LLL, yy", { locale: es })} -{" "}
                      {format(dateRangeFilter.to, "dd LLL, yy", { locale: es })}
                    </>
                  ) : (
                    format(dateRangeFilter.from, "dd LLL, yy", { locale: es })
                  )
                ) : (
                  <span>Seleccionar rango</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRangeFilter?.from}
                selected={dateRangeFilter}
                onSelect={setDateRangeFilter}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
          
          {activeFiltersCount > 0 && (
            <Button variant="ghost" onClick={clearAllFilters} className="text-muted-foreground hover:text-foreground gap-1.5" title="Limpiar Todos los Filtros">
              <X className="h-4 w-4" /> Limpiar Filtros
            </Button>
          )}

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
                        {isDeleting && invoiceToDelete?.id === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-600" />}
                      </Button>
                       {/* PDFDownloadLink and related logic commented out to prevent hasOwnProperty error */}
                       <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 cursor-not-allowed" title="Descargar PDF (deshabilitado en lista)" disabled>
                          {/* <Download className="h-4 w-4 text-blue-600 opacity-50" /> */}
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
          {activeFiltersCount === 0 && (
            <Button variant="link" className="mt-2" asChild>
              <Link href="/billing/add">Crea tu primera factura</Link>
            </Button>
          )}
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
            <AlertDialogCancel disabled={isDeleting} onClick={() => { setInvoiceToDelete(null); }}>Cancelar</AlertDialogCancel>
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
