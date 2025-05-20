
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Invoice, Client, WithConvertedDates, InvoiceItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, Printer, ArrowLeft, AlertTriangle, FileText, Building, UserCircle, Phone, Mail, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePdfDocument from '@/components/billing/invoice-pdf-document';

interface AgencyDetails {
  agencyName?: string;
  address?: string;
  taxId?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
}

type InvoiceWithConvertedDates = WithConvertedDates<Invoice>;
type ClientWithConvertedDates = WithConvertedDates<Client>;

// Function to convert Firestore Timestamps to JS Date objects
function convertTimestampsToDates<T extends Record<string, any>>(docData: T | undefined): WithConvertedDates<T> | undefined {
  if (!docData) return undefined;
  const data = { ...docData } as Partial<WithConvertedDates<T>>;
  for (const key in data) {
    if (data[key as keyof T] instanceof Timestamp) {
      data[key as keyof T] = (data[key as keyof T] as Timestamp).toDate() as any;
    } else if (Array.isArray(data[key as keyof T])) {
      (data[key as keyof T] as any) = (data[key as keyof T] as any[]).map(item =>
        typeof item === 'object' && item !== null && !(item instanceof Date) ? convertTimestampsToDates(item) : item
      );
    } else if (typeof data[key as keyof T] === 'object' && data[key as keyof T] !== null && !((data[key as keyof T]) instanceof Date)) {
      (data[key as keyof T] as any) = convertTimestampsToDates(data[key as keyof T] as any);
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
  const [isClient, setIsClient] = useState(false); // For client-side only rendering of PDFLink

  useEffect(() => {
    setIsClient(true); // Ensures PDFDownloadLink only renders on client
    const fetchInvoiceData = async () => {
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
          setIsLoading(false);
          return;
        }
        const fetchedInvoice = convertTimestampsToDates(invoiceSnap.data() as Invoice);
        setInvoice(fetchedInvoice ?? null);

        // Fetch Client if invoice exists
        if (fetchedInvoice?.clientId) {
          const clientDocRef = doc(db, 'clients', fetchedInvoice.clientId);
          const clientSnap = await getDoc(clientDocRef);
          if (clientSnap.exists()) {
            setClient(convertTimestampsToDates(clientSnap.data() as Client) ?? null);
          } else {
            console.warn(`Cliente con ID ${fetchedInvoice.clientId} no encontrado para la factura ${invoiceId}`);
            setClient(null); 
          }
        } else {
          setClient(null); 
        }

        // Fetch Agency Details
        const agencyDocRef = doc(db, 'settings', 'agencyDetails');
        const agencySnap = await getDoc(agencyDocRef);
        if (agencySnap.exists()) {
          setAgencyDetails(agencySnap.data() as AgencyDetails);
        } else {
          setAgencyDetails({ 
            agencyName: "Tu Agencia S.L.",
            address: "Calle Falsa 123, Ciudad, CP",
            taxId: "NIF/CIF: X1234567Z",
            contactEmail: "contacto@tuagencia.com",
            contactPhone: "+34 900 000 000"
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
    };

    fetchInvoiceData();
  }, [invoiceId, toast]);

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

  if (error) {
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
    return <div className="text-center py-10">Factura no encontrada.</div>;
  }

  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = 0; 
  const total = subtotal + taxAmount; // This was previously used, but invoice.totalAmount is what's stored.

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-background">
      <Card className="shadow-2xl print:shadow-none">
        <CardHeader className="bg-muted/30 p-6 print:bg-transparent">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-3xl font-bold">Factura</CardTitle>
              <CardDescription>ID: {invoice.id.substring(0,10).toUpperCase()}</CardDescription>
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
                  <p className="font-medium text-lg">{client.name}</p>
                  {client.clinica && <p className="text-muted-foreground flex items-center"><Building className="mr-2 h-4 w-4 opacity-70"/> {client.clinica}</p>}
                  <p className="text-muted-foreground flex items-center"><Mail className="mr-2 h-4 w-4 opacity-70"/> {client.email}</p>
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
                <span className="font-semibold text-primary">{invoice.status}</span>
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
                {invoice.items.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.unitPrice.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
                    <TableCell className="text-right">{(item.quantity * item.unitPrice).toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</TableCell>
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
                <span className="text-muted-foreground">Impuestos (IVA 0%):</span> 
                <span>{taxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>TOTAL:</span>
                <span>{invoice.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
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
            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
              {isClient && invoice && client && agencyDetails && (
                <PDFDownloadLink
                  document={<InvoicePdfDocument invoice={invoice} client={client} agencyDetails={agencyDetails} />}
                  fileName={`Factura-${invoice.id.substring(0,8).toUpperCase()}.pdf`}
                >
                  {({ loading }) => (
                    <Button disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Descargar PDF
                    </Button>
                  )}
                </PDFDownloadLink>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

