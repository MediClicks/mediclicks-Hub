
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Invoice, Client, WithConvertedDates, AgencyDetails, InvoiceItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, Printer, ArrowLeft, AlertTriangle, FileText, Building, UserCircle, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// PDFDownloadLink and InvoicePdfDocument are commented out due to persistent 'hasOwnProperty' errors.
// import { PDFDownloadLink } from '@react-pdf/renderer';
// import InvoicePdfDocument from '@/components/billing/invoice-pdf-document';

type InvoiceWithConvertedDates = WithConvertedDates<Invoice>;
type ClientWithConvertedDates = WithConvertedDates<Client>;

// Function to convert Firestore Timestamps to JS Date objects recursively
function convertTimestampsToDates<T extends Record<string, any>>(docData: T | undefined): WithConvertedDates<T> | undefined {
  if (!docData) return undefined;
  const data = { ...docData } as Partial<WithConvertedDates<T>>;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key as keyof T];
      if (value instanceof Timestamp) {
        (data[key as keyof T] as any) = value.toDate();
      } else if (Array.isArray(value)) {
        (data[key as keyof T] as any) = value.map(item =>
          typeof item === 'object' && item !== null && !(item instanceof Date) ? convertTimestampsToDates(item as any) : item
        );
      } else if (typeof value === 'object' && value !== null && !((value) instanceof Date)) {
        (data[key as keyof T] as any) = convertTimestampsToDates(value as any);
      }
    }
  }
  return data as WithConvertedDates<T>;
}


export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceWithConvertedDates | null>(null);
  const [client, setClient] = useState<ClientWithConvertedDates | null>(null);
  const [agencyDetails, setAgencyDetails] = useState<AgencyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [isClient, setIsClient] = useState(false); // Commented out as PDFLink is disabled

  // useEffect(() => { // Commented out
  //   setIsClient(true);
  // }, []);

  const fetchInvoiceData = useCallback(async () => {
    if (!invoiceId) {
      setError("ID de factura no válido.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch Invoice
      const invoiceDocRef = doc(db, 'invoices', invoiceId);
      const invoiceSnap = await getDoc(invoiceDocRef);

      if (!invoiceSnap.exists()) {
        setError('Factura no encontrada.');
        setInvoice(null);
        setIsLoading(false);
        return;
      }
      
      const firestoreData = invoiceSnap.data() as Omit<Invoice, 'id'>; // Data from Firestore
      const invoiceDataWithCorrectId: Invoice = { // Ensure the object structure matches Invoice type
        ...firestoreData,
        id: invoiceSnap.id, 
      };
      const fetchedInvoice = convertTimestampsToDates(invoiceDataWithCorrectId);
      setInvoice(fetchedInvoice ?? null);

      if (fetchedInvoice?.clientId) {
        const clientDocRef = doc(db, 'clients', fetchedInvoice.clientId);
        const clientSnap = await getDoc(clientDocRef);
        if (clientSnap.exists()) {
          const clientDataFromFirestore = clientSnap.data() as Omit<Client, 'id'>;
          const clientDataWithCorrectId: Client = {
              ...clientDataFromFirestore, 
              id: clientSnap.id, 
          };
          setClient(convertTimestampsToDates(clientDataWithCorrectId) ?? null);
        } else {
          console.warn(`Cliente con ID ${fetchedInvoice.clientId} no encontrado para la factura ${invoiceId}`);
          setClient(null); 
        }
      } else {
        setClient(null); 
      }

      const agencyDocRef = doc(db, 'settings', 'agencyDetails');
      const agencySnap = await getDoc(agencyDocRef);
      if (agencySnap.exists()) {
        setAgencyDetails(agencySnap.data() as AgencyDetails);
      } else {
        // Fallback if agency details are not set in Firestore
        setAgencyDetails({ 
          agencyName: "MediClicks Hub",
          address: "Tu Dirección Completa Aquí",
          taxId: "Tu NIF/CIF Aquí",
          contactEmail: "contacto@tuagencia.com",
          contactPhone: "+XX XXX XXX XXX",
          website: "www.tuagencia.com"
        });
      }

    } catch (err) {
      console.error("Error fetching invoice data:", err);
      setError('Error al cargar los datos de la factura.');
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar los detalles de la factura.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, toast]);


  useEffect(() => {
    fetchInvoiceData();
  }, [fetchInvoiceData]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando factura...</p>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error al Cargar Factura</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/billing')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Facturación
        </Button>
      </div>
    );
  }
  
  if (!invoice) {
    return (
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Factura no Encontrada</h2>
            <p className="text-muted-foreground mb-6">La factura solicitada no existe o no se pudo encontrar.</p>
            <Button onClick={() => router.push('/billing')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Facturación
            </Button>
        </div>
    );
  }
  
  const displayInvoiceId = invoice.id ? String(invoice.id).substring(0,10).toUpperCase() : 'ID N/A';

  const subtotal = Array.isArray(invoice.items) ? invoice.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0) : 0;
  const displayTaxRate = invoice.taxRate || 0;
  const displayTaxAmount = invoice.taxAmount || 0;
  const total = invoice.totalAmount || 0; // This should already include tax

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-background">
      <Card className="shadow-2xl print:shadow-none">
        <CardHeader className="bg-muted/30 p-6 print:bg-transparent">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-3xl font-bold">Factura</CardTitle>
              <CardDescription>ID: {displayInvoiceId}</CardDescription>
            </div>
            <div className="text-left sm:text-right">
              <h3 className="text-xl font-semibold text-primary">{agencyDetails?.agencyName || "Nombre de Agencia"}</h3>
              <p className="text-sm text-muted-foreground">{agencyDetails?.address || "Dirección de Agencia"}</p>
              <p className="text-sm text-muted-foreground">{agencyDetails?.taxId || "NIF/CIF Agencia"}</p>
              <p className="text-sm text-muted-foreground">{agencyDetails?.contactEmail || "Email Agencia"}</p>
              {agencyDetails?.contactPhone && <p className="text-sm text-muted-foreground">Tel: {agencyDetails.contactPhone}</p>}
              {agencyDetails?.website && <p className="text-sm text-muted-foreground">{agencyDetails.website}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2 p-4 border rounded-lg bg-secondary/20">
              <h4 className="font-semibold text-primary flex items-center"><UserCircle className="mr-2 h-5 w-5"/>Facturar a:</h4>
              {client ? (
                <>
                  <p className="font-medium text-lg">{client.name || 'N/A'}</p>
                  {client.clinica && <p className="text-muted-foreground flex items-center"><Building className="mr-2 h-4 w-4 opacity-70"/> {client.clinica}</p>}
                  <p className="text-muted-foreground flex items-center"><Mail className="mr-2 h-4 w-4 opacity-70"/> {client.email || 'N/A'}</p>
                  {client.telefono && <p className="text-muted-foreground flex items-center"><Phone className="mr-2 h-4 w-4 opacity-70"/> {client.telefono}</p>}
                </>
              ) : (
                <p className="text-muted-foreground">Información del cliente no disponible.</p>
              )}
            </div>
            <div className="space-y-2 p-4 border rounded-lg bg-secondary/20">
              <h4 className="font-semibold text-primary">Detalles de la Factura:</h4>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de Emisión:</span>
                <span>{invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString('es-ES') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de Vencimiento:</span>
                <span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-semibold text-primary">{invoice.status || 'N/A'}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-lg font-semibold mb-3 text-primary">Conceptos</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Descripción</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(invoice.items) ? invoice.items : []).map((item, index) => (
                  <TableRow key={item.id || `item-${index}`}>
                    <TableCell>{item.description || 'N/A'}</TableCell>
                    <TableCell className="text-right">{item.quantity || 0}</TableCell>
                    <TableCell className="text-right">{(item.unitPrice || 0).toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
                    <TableCell className="text-right">{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="flex justify-end">
            <div className="w-full sm:w-1/2 md:w-1/3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{subtotal.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos ({displayTaxRate}%):</span> 
                <span>{displayTaxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>TOTAL:</span>
                <span>{total.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-md font-semibold mb-1 text-primary">Notas Adicionales:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="p-6 border-t print:hidden">
          <div className="flex w-full justify-between items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/billing')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline" title="Imprimir Factura">
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
              {/* PDFDownloadLink is currently disabled due to persistent errors.
                  Users can use the browser's print-to-PDF functionality.
              <Button variant="outline" disabled title="Descarga PDF no disponible temporalmente">
                <Download className="mr-2 h-4 w-4 opacity-50" />
                Descargar PDF
              </Button>
              */}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
