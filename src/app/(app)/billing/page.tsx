
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
import { Button } from "@/components/ui/button";
import type { Invoice, InvoiceStatus, WithConvertedDates, Client } from "@/types";
import { PlusCircle, Download, Eye, Edit2, Loader2, Receipt, AlertTriangle, Trash2, Filter, UserCircle, CheckSquare, Clock } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc, where, QueryConstraint } from 'firebase/firestore';
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<InvoiceStatus, string> = {
  Pagada: "bg-green-500 border-green-600 hover:bg-green-600 text-white",
  "No Pagada": "bg-yellow-500 border-yellow-600 hover:bg-yellow-600 text-white",
  Vencida: "bg-red-500 border-red-600 hover:bg-red-600 text-white",
};

function convertInvoiceTimestamps(docData: any): WithConvertedDates<Invoice> {
  const data = { ...docData } as Partial<WithConvertedDates<Invoice>>;
  for (const key in data) {
    if (data[key as keyof Invoice] instanceof Timestamp) {
      data[key as keyof Invoice] = (data[key as keyof Invoice] as Timestamp).toDate() as any;
    } else if (Array.isArray(data[key as keyof Invoice])) {
      (data[key as keyof Invoice] as any) = (data[key as keyof Invoice] as any[]).map(item =>
        typeof item === 'object' && item !== null && !(item instanceof Date) ? convertInvoiceTimestamps(item) : item
      );
    } else if (typeof data[key as keyof Invoice] === 'object' && data[key as keyof Invoice] !== null && !((data[key as keyof Invoice]) instanceof Date)) {
      (data[key as keyof Invoice] as any) = convertInvoiceTimestamps(data[key as keyof Invoice] as any);
    }
  }
  return data as WithConvertedDates<Invoice>;
}

function convertClientTimestamps(docData: any): WithConvertedDates<Client> {
  const data = { ...docData } as Partial<WithConvertedDates<Client>>;
  for (const key in data) {
    if (data[key as keyof Client] instanceof Timestamp) {
      data[key as keyof Client] = (data[key as keyof Client] as Timestamp).toDate() as any;
    }
  }
  return data as WithConvertedDates<Client>;
}


const ALL_FILTER_VALUE = 'All';
type StatusFilterType = InvoiceStatus | typeof ALL_FILTER_VALUE;
type ClientFilterType = string | typeof ALL_FILTER_VALUE;


const invoiceStatusesForFilter: InvoiceStatus[] = ['Pagada', 'No Pagada', 'Vencida'];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<WithConvertedDates<Invoice>[]>([]);
  const [clientsForFilter, setClientsForFilter] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<WithConvertedDates<Invoice> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(ALL_FILTER_VALUE);
  const [clientFilter, setClientFilter] = useState<ClientFilterType>(ALL_FILTER_VALUE);


  const fetchClientsForFilter = useCallback(async () => {
    setIsLoadingClients(true);
    try {
      const clientsCollection = collection(db, "clients");
      const q = query(clientsCollection, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const convertedData = convertClientTimestamps(data as Client);
        return { id: doc.id, ...convertedData };
      });
      setClientsForFilter(clientsData);
    } catch (err) {
      console.error("Error fetching clients for filter: ", err);
      toast({ title: "Advertencia", description: "No se pudieron cargar los clientes para el filtro.", variant: "default" });
    } finally {
      setIsLoadingClients(false);
    }
  }, [toast]);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const invoicesCollection = collection(db, "invoices");
      const queryConstraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

      if (statusFilter !== ALL_FILTER_VALUE) {
        queryConstraints.unshift(where("status", "==", statusFilter));
      }
      if (clientFilter !== ALL_FILTER_VALUE) {
        queryConstraints.unshift(where("clientId", "==", clientFilter));
      }

      const q = query(invoicesCollection, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      const invoicesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const convertedData = convertInvoiceTimestamps(data as Invoice);
        return { id: doc.id, ...convertedData };
      });
      setInvoices(invoicesData);
    } catch (err: any) {
      console.error("Error fetching invoices: ", err);
      if (err.message && err.message.includes("index")) {
        setError(`Se requiere un índice de Firestore para esta consulta. Por favor, créalo usando el enlace en la consola de errores del navegador y luego recarga la página. (${err.message})`);
      } else {
        setError("No se pudieron cargar las facturas. Intenta de nuevo más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, clientFilter]);

  useEffect(() => {
    fetchClientsForFilter();
    fetchInvoices();
  }, [fetchClientsForFilter, fetchInvoices]);

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

  const getEmptyStateIcon = () => {
    if (statusFilter === 'Pagada') return <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
    if (statusFilter === 'No Pagada' || statusFilter === 'Vencida') return <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
    return <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-3" />;
  };

  const getEmptyStateMessage = () => {
    let message = "No se encontraron facturas";
    const clientName = clientFilter !== ALL_FILTER_VALUE ? clientsForFilter.find(c => c.id === clientFilter)?.name : null;

    if (statusFilter !== ALL_FILTER_VALUE && clientFilter !== ALL_FILTER_VALUE && clientName) {
      message += ` con estado "${statusFilter}" para el cliente "${clientName}".`;
    } else if (statusFilter !== ALL_FILTER_VALUE) {
      message += ` con estado "${statusFilter}".`;
    } else if (clientFilter !== ALL_FILTER_VALUE && clientName) {
      message += ` para el cliente "${clientName}".`;
    } else {
      message += ".";
    }
    return message;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Facturación y Cobros</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" /> Filtrar por Estado
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Seleccionar Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === ALL_FILTER_VALUE}
                onCheckedChange={() => setStatusFilter(ALL_FILTER_VALUE)}
              >
                Todas
              </DropdownMenuCheckboxItem>
              {invoiceStatusesForFilter.map(status => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() => setStatusFilter(statusFilter === status ? ALL_FILTER_VALUE : status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isLoadingClients}>
                <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" /> 
                {isLoadingClients ? "Cargando clientes..." : "Filtrar por Cliente"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
              <DropdownMenuLabel>Seleccionar Cliente</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={clientFilter} onValueChange={setClientFilter}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>
                  Todos los Clientes
                </DropdownMenuRadioItem>
                {clientsForFilter.map(client => (
                  <DropdownMenuRadioItem key={client.id} value={client.id}>
                    {client.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild>
            <Link href="/billing/add">
              <PlusCircle className="mr-2 h-4 w-4 text-primary-foreground" /> Crear Nueva Factura
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Cargando facturas...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-12 text-destructive bg-destructive/10 p-4 rounded-md whitespace-pre-wrap">
          <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-destructive" />
          <p className="text-lg">{error}</p>
          <Button variant="link" onClick={fetchInvoices} className="mt-2">Reintentar Carga</Button>
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
                  <TableCell className="font-medium">{invoice.id.substring(0, 8).toUpperCase()}</TableCell>
                  <TableCell>{invoice.clientName || 'N/A'}</TableCell>
                  <TableCell>{invoice.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
                  <TableCell>{invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                  <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={cn("border text-xs", statusColors[invoice.status])}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="hover:text-primary" title="Ver Factura" asChild>
                       <Link href={`/billing/${invoice.id}/view`}>
                        <Eye className="h-4 w-4 text-sky-600" />
                       </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-yellow-500" title="Editar Factura" asChild>
                      <Link href={`/billing/${invoice.id}/edit`}>
                        <Edit2 className="h-4 w-4 text-yellow-600" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" title="Eliminar Factura" onClick={() => setInvoiceToDelete(invoice)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
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
          {getEmptyStateIcon()}
          <p className="text-lg">{getEmptyStateMessage()}</p>
          <Button variant="link" className="mt-2" asChild>
            <Link href="/billing/add">Crea tu primera factura</Link>
          </Button>
        </div>
      )}

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la factura con ID {invoiceToDelete?.id.substring(0, 8).toUpperCase()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setInvoiceToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, eliminar factura"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

