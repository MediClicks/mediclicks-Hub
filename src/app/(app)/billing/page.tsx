
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
import type { Invoice, InvoiceStatus, WithConvertedDates, Client, AgencyDetails, InvoiceItem, ServiceDefinition, PaymentModality, ContractedServiceClient, SocialMediaAccountClient } from "@/types";
import { PlusCircle, Download, Eye, Edit2, Loader2, Receipt, AlertTriangle, Trash2, Filter, UserCircle } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc, where, QueryConstraint, getDoc } from 'firebase/firestore';
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
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePdfDocument from '@/components/billing/invoice-pdf-document';

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

const ALL_FILTER_VALUE = 'All';
type StatusFilterType = InvoiceStatus | typeof ALL_FILTER_VALUE;
type ClientFilterType = string | typeof ALL_FILTER_VALUE;

const invoiceStatusesForFilter: InvoiceStatus[] = ['Pagada', 'No Pagada', 'Vencida'];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<WithConvertedDates<Invoice>[]>([]);
  const [clientsForFilter, setClientsForFilter] = useState<WithConvertedDates<Client>[]>([]);
  const [allClients, setAllClients] = useState<Record<string, WithConvertedDates<Client>>>({});
  const [agencyDetails, setAgencyDetails] = useState<AgencyDetails | null>(null);

  const [isLoading, setIsLoading] = useState(true); // General loading for invoices table
  const [isLoadingClients, setIsLoadingClients] = useState(true); // Loading for client filter dropdown and PDF data
  const [isLoadingAgencyDetails, setIsLoadingAgencyDetails] = useState(true); // Loading for agency details PDF data

  const [error, setError] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<WithConvertedDates<Invoice> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(ALL_FILTER_VALUE);
  const [clientFilter, setClientFilter] = useState<ClientFilterType>(ALL_FILTER_VALUE);
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  const fetchInitialData = useCallback(async () => {
    setIsLoadingClients(true);
    setIsLoadingAgencyDetails(true);

    // Fetch Clients for filter and PDF
    try {
      const clientsCollection = collection(db, "clients");
      const clientsQuery = query(clientsCollection, orderBy("name", "asc"));
      const clientsSnapshot = await getDocs(clientsQuery);
      const fetchedClientsForFilter = clientsSnapshot.docs.map(doc => {
        const data = convertFirestoreTimestamps<Client>(doc.data() as Client);
        return { id: doc.id, ...data };
      });
      const fetchedAllClients: Record<string, WithConvertedDates<Client>> = {};
      fetchedClientsForFilter.forEach(client => {
        fetchedAllClients[client.id] = client;
      });
      setClientsForFilter(fetchedClientsForFilter);
      setAllClients(fetchedAllClients);
    } catch (err) {
      console.error("Error fetching clients: ", err);
      toast({ title: "Advertencia", description: "No se pudieron cargar los clientes para el filtro y PDFs.", variant: "default" });
    } finally {
      setIsLoadingClients(false);
    }

    // Fetch Agency Details for PDF
    try {
      const agencyDocRef = doc(db, 'settings', 'agencyDetails');
      const agencySnap = await getDoc(agencyDocRef);
      if (agencySnap.exists()) {
        setAgencyDetails(agencySnap.data() as AgencyDetails);
      } else {
        console.warn("Agency details not found in settings. PDF will use placeholders.");
        setAgencyDetails(null); // Explicitly set to null if not found
      }
    } catch (err) {
      console.error("Error fetching agency details: ", err);
      toast({ title: "Advertencia", description: "No se pudieron cargar los detalles de la agencia para los PDFs.", variant: "default" });
      setAgencyDetails(null); // Set to null on error
    } finally {
      setIsLoadingAgencyDetails(false);
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
  }, [statusFilter, clientFilter]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!isLoadingClients && !isLoadingAgencyDetails) {
        fetchInvoices();
    }
  }, [fetchInvoices, isLoadingClients, isLoadingAgencyDetails]);


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

  const getEmptyStateMessage = () => {
    let message = "No se encontraron facturas";
    const filtersApplied: string[] = [];
    if (statusFilter !== ALL_FILTER_VALUE) {
      filtersApplied.push(`estado "${statusFilter}"`);
    }
    const clientName = clientFilter !== ALL_FILTER_VALUE ? clientsForFilter.find(c => c.id === clientFilter)?.name : null;
    if (clientFilter !== ALL_FILTER_VALUE && clientName) {
      filtersApplied.push(`cliente "${clientName}"`);
    }

    if (filtersApplied.length > 0) {
      message += ` con ${filtersApplied.join(' y ')}.`;
    } else {
      message += ".";
    }
    return message;
  };

  const currentFilteredClientName = clientFilter !== ALL_FILTER_VALUE
    ? clientsForFilter.find(c => c.id === clientFilter)?.name
    : null;

  const isLoadingOverall = isLoading || isLoadingClients || isLoadingAgencyDetails;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Facturación y Cobros</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                {statusFilter === ALL_FILTER_VALUE ? "Filtrar por Estado" : `Estado: ${statusFilter}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Seleccionar Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilterType)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todas</DropdownMenuRadioItem>
                {invoiceStatusesForFilter.map(status => (
                  <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isLoadingClients}>
                <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                {isLoadingClients && "Cargando clientes..."}
                {!isLoadingClients && (currentFilteredClientName ? `Cliente: ${currentFilteredClientName}` : "Filtrar por Cliente")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
              <DropdownMenuLabel>Seleccionar Cliente</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={clientFilter} onValueChange={(value) => setClientFilter(value as ClientFilterType)}>
                <DropdownMenuRadioItem value={ALL_FILTER_VALUE}>Todos los Clientes</DropdownMenuRadioItem>
                {clientsForFilter.map(client => (
                  <DropdownMenuRadioItem key={client.id} value={client.id}>{client.name}</DropdownMenuRadioItem>
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
                const clientForPdf = allClients[invoice.clientId];
                
                const currentInvoiceDataForPdf: WithConvertedDates<Invoice> = {
                  id: String(invoice?.id || `invoice-pdf-${Date.now()}`),
                  clientId: String(invoice?.clientId || ""),
                  clientName: String(invoice?.clientName || "Cliente N/A"),
                  issuedDate: invoice?.issuedDate instanceof Date ? invoice.issuedDate : new Date(0),
                  dueDate: invoice?.dueDate instanceof Date ? invoice.dueDate : new Date(0),
                  status: (invoice?.status as InvoiceStatus) || "No Pagada",
                  items: (Array.isArray(invoice?.items) ? invoice.items : []).map((item, index) => ({
                    id: String(item?.id || `item-pdf-item-${index}-${Date.now()}`),
                    description: String(item?.description || "N/A"),
                    quantity: Number.isFinite(item?.quantity as number) ? Number(item.quantity) : 0,
                    unitPrice: Number.isFinite(item?.unitPrice as number) ? Number(item.unitPrice) : 0,
                  })) as InvoiceItem[],
                  totalAmount: Number.isFinite(invoice?.totalAmount as number) ? Number(invoice.totalAmount) : 0,
                  notes: typeof invoice?.notes === 'string' ? invoice.notes : undefined,
                  createdAt: invoice?.createdAt instanceof Date ? invoice.createdAt : new Date(0),
                  updatedAt: invoice?.updatedAt instanceof Date ? invoice.updatedAt : new Date(0),
                };
                
                let sanitizedClientForPdf: WithConvertedDates<Client> | undefined = undefined;
                if (clientForPdf) {
                  sanitizedClientForPdf = {
                    id: String(clientForPdf?.id || `client-pdf-${Date.now()}`),
                    name: String(clientForPdf?.name || "Cliente N/A"),
                    email: String(clientForPdf?.email || "email@ejemplo.com"),
                    clinica: typeof clientForPdf?.clinica === 'string' ? clientForPdf.clinica : undefined,
                    telefono: typeof clientForPdf?.telefono === 'string' ? clientForPdf.telefono : undefined,
                    avatarUrl: typeof clientForPdf?.avatarUrl === 'string' ? clientForPdf.avatarUrl : undefined,
                    services: Array.isArray(clientForPdf?.services) ? clientForPdf.services.map(s => ({...s})) : [],
                    contractedServices: Array.isArray(clientForPdf?.contractedServices) ? clientForPdf.contractedServices.map(s => ({
                      serviceName: String(s?.serviceName || "N/A"),
                      price: Number.isFinite(s?.price as number) ? Number(s.price) : 0,
                      paymentModality: (s?.paymentModality as PaymentModality) || "Único",
                    })) : [],
                    socialMediaAccounts: Array.isArray(clientForPdf?.socialMediaAccounts) ? clientForPdf.socialMediaAccounts.map(s => ({
                      platform: String(s?.platform || "N/A"),
                      username: String(s?.username || "N/A"),
                      password: typeof s?.password === 'string' ? s.password : undefined,
                    })) : [],
                    contractStartDate: clientForPdf?.contractStartDate instanceof Date ? clientForPdf.contractStartDate : new Date(0),
                    nextBillingDate: undefined, // Removed field
                    profileSummary: String(clientForPdf?.profileSummary || ""),
                    serviciosActivosGeneral: undefined, // Removed field
                    pagado: typeof clientForPdf?.pagado === 'boolean' ? clientForPdf.pagado : false,
                    notas: undefined, // Removed field
                    dominioWeb: typeof clientForPdf?.dominioWeb === 'string' ? clientForPdf.dominioWeb : undefined,
                    tipoServicioWeb: typeof clientForPdf?.tipoServicioWeb === 'string' ? clientForPdf.tipoServicioWeb : undefined,
                    vencimientoWeb: clientForPdf?.vencimientoWeb instanceof Date ? clientForPdf.vencimientoWeb : undefined,
                    plataformasRedesSociales: undefined, // Removed field
                    detallesRedesSociales: undefined, // Removed field
                    serviciosContratadosAdicionales: undefined, // Removed field
                    configuracionRedesSociales: undefined, // Removed field
                    credencialesRedesUsuario: typeof clientForPdf?.credencialesRedesUsuario === 'string' ? clientForPdf.credencialesRedesUsuario : undefined, // Legacy field
                    credencialesRedesContrasena: typeof clientForPdf?.credencialesRedesContrasena === 'string' ? clientForPdf.credencialesRedesContrasena : undefined, // Legacy field
                    createdAt: clientForPdf?.createdAt instanceof Date ? clientForPdf.createdAt : new Date(0),
                    updatedAt: clientForPdf?.updatedAt instanceof Date ? clientForPdf.updatedAt : new Date(0),
                  };
                }
                
                const safeAgencyDetails: AgencyDetails = agencyDetails || {
                    agencyName: "Tu Agencia S.L.",
                    address: "Calle Falsa 123, Ciudad, CP",
                    taxId: "NIF/CIF: X1234567Z",
                    contactEmail: "contacto@tuagencia.com",
                    contactPhone: "+34 900 000 000",
                    website: "https://www.tuagencia.com"
                };

                // Condition for rendering PDF download link - ensure all necessary data is present
                const canRenderPdfLink = isClientSide && currentInvoiceDataForPdf && sanitizedClientForPdf && safeAgencyDetails;

                return (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                       <Link href={`/billing/${invoice.id}/view`} className="hover:underline text-primary">
                        {invoice.id.substring(0, 8).toUpperCase()}
                      </Link>
                    </TableCell>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        title="Eliminar Factura"
                        onClick={() => setInvoiceToDelete(invoice)}
                        disabled={isDeleting && invoiceToDelete?.id === invoice.id}
                       >
                        {isDeleting && invoiceToDelete?.id === invoice.id ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <Trash2 className="h-4 w-4 text-red-600" />}
                      </Button>
                      {/* Temporarily disabling PDFDownloadLink in the list view due to persistent 'hasOwnProperty' error */}
                      <Button variant="ghost" size="icon" className="text-blue-600 opacity-50 cursor-not-allowed" title="Descargar PDF (deshabilitado en lista)" disabled>
                        <Download className="h-4 w-4 opacity-50" />
                      </Button>
                      {/* 
                      {canRenderPdfLink ? (
                        <PDFDownloadLink
                          document={<InvoicePdfDocument invoice={currentInvoiceDataForPdf} client={sanitizedClientForPdf} agencyDetails={safeAgencyDetails} />}
                          fileName={`factura-${currentInvoiceDataForPdf.id.substring(0,8).toLowerCase()}.pdf`}
                        >
                          {({ loading }) => (
                            <Button variant="ghost" size="icon" className="hover:text-accent text-blue-600" title="Descargar PDF" disabled={loading || isLoadingClients || isLoadingAgencyDetails}>
                              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" /> : <Download className="h-4 w-4 text-blue-600" />}
                            </Button>
                          )}
                        </PDFDownloadLink>
                      ) : (
                         <Button variant="ghost" size="icon" className="text-blue-600 opacity-50 cursor-not-allowed" title="Descargar PDF no disponible" disabled>
                           <Download className="h-4 w-4 opacity-50" />
                         </Button>
                      )}
                      */}
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
          {(statusFilter === ALL_FILTER_VALUE && clientFilter === ALL_FILTER_VALUE) && (
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

