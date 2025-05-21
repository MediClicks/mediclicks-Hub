
'use client';

import { useEffect, useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceStatus, InvoiceItem, Client, WithConvertedDates, Invoice } from '@/types';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, serverTimestamp, getDocs, query, orderBy, Timestamp, deleteField } from 'firebase/firestore';

const invoiceStatuses: InvoiceStatus[] = ['No Pagada', 'Pagada', 'Vencida'];

let itemIdCounter = 0;

const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, { message: 'La descripción es obligatoria.' }),
  quantity: z.coerce.number().min(1, { message: 'Cantidad debe ser al menos 1.' }),
  unitPrice: z.coerce.number().min(0, { message: 'El precio no puede ser negativo.' }),
});

const invoiceFormSchema = z.object({
  clientId: z.string({ required_error: 'Debe seleccionar un cliente.' }).min(1, "Debe seleccionar un cliente."),
  issuedDate: z.date({ required_error: 'La fecha de emisión es obligatoria.' }),
  dueDate: z.date({ required_error: 'La fecha de vencimiento es obligatoria.' }),
  status: z.enum(invoiceStatuses, { required_error: 'El estado es obligatorio.' }),
  items: z.array(invoiceItemSchema).min(1, { message: 'Debe agregar al menos un ítem a la factura.' }),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

function convertClientTimestampsToDates(docData: any): WithConvertedDates<Client> {
   const data = { ...docData } as Partial<WithConvertedDates<Client>>;
  for (const key in data) {
    if (data[key as keyof Client] instanceof Timestamp) {
      data[key as keyof Client] = (data[key as keyof Client] as Timestamp).toDate() as any;
    }
  }
  return data as WithConvertedDates<Client>;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [invoiceNotFound, setInvoiceNotFound] = useState(false);
  const [clientsList, setClientsList] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: '',
      status: 'No Pagada',
      items: [],
      notes: '',
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const fetchClients = useCallback(async () => {
    setIsLoadingClients(true);
    setClientError(null);
    try {
      const clientsCollection = collection(db, "clients");
      const q = query(clientsCollection, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedClients = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const convertedData = convertClientTimestampsToDates(data as Client);
        return { id: doc.id, ...convertedData };
      });
      setClientsList(fetchedClients);
    } catch (err) {
      console.error("Error fetching clients for dropdown: ", err);
      setClientError('No se pudieron cargar los clientes.');
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (invoiceId) {
      const fetchInvoice = async () => {
        setIsLoadingInvoice(true);
        setInvoiceNotFound(false);
        try {
          const invoiceDocRef = doc(db, 'invoices', invoiceId);
          const docSnap = await getDoc(invoiceDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as Invoice;

            itemIdCounter = data.items.length;

            const formData: InvoiceFormValues = {
              clientId: data.clientId,
              issuedDate: data.issuedDate instanceof Timestamp ? data.issuedDate.toDate() : new Date(data.issuedDate),
              dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
              status: data.status,
              items: data.items.map((item, index) => ({
                ...item,
                id: `item-${index}-${Date.now()}`
              })),
              notes: data.notes || '',
            };
            form.reset(formData);
          } else {
            setInvoiceNotFound(true);
            toast({ title: 'Error', description: 'Factura no encontrada.', variant: 'destructive' });
            router.push('/billing');
          }
        } catch (error) {
          console.error("Error fetching invoice: ", error);
          toast({ title: 'Error', description: 'No se pudo cargar la información de la factura.', variant: 'destructive' });
        } finally {
          setIsLoadingInvoice(false);
        }
      };
      fetchInvoice();
    } else {
      setIsLoadingInvoice(false);
      setInvoiceNotFound(true);
      toast({ title: 'Error', description: 'ID de factura no válido.', variant: 'destructive' });
      router.push('/billing');
    }
  }, [invoiceId, toast, form, router]);


  const watchItems = form.watch('items');
  const totalAmount = watchItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);


  async function onSubmit(data: InvoiceFormValues) {
    form.clearErrors();
    try {
      const invoiceDocRef = doc(db, 'invoices', invoiceId);
      const clientName = clientsList.find(c => c.id === data.clientId)?.name;

      const invoiceDataToUpdate: any = {
        ...data,
        clientName: clientName,
        totalAmount: totalAmount,
        updatedAt: serverTimestamp(),
        items: data.items.map(({ id, ...rest }) => rest),
      };

      if (data.notes && data.notes.trim() !== '') {
        invoiceDataToUpdate.notes = data.notes;
      } else {
        invoiceDataToUpdate.notes = deleteField();
      }

      await updateDoc(invoiceDocRef, invoiceDataToUpdate);

      toast({
        title: 'Factura Actualizada',
        description: `La factura para ${clientName || 'el cliente seleccionado'} ha sido actualizada.`,
      });
      router.push('/billing');

    } catch (e) {
      console.error('Error al actualizar factura en Firestore: ', e);
      toast({
        title: 'Error al Guardar Factura',
        description: 'Hubo un problema al guardar la factura. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }

  if (isLoadingInvoice || isLoadingClients) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando datos de la factura...</p>
      </div>
    );
  }

  if (invoiceNotFound) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Factura no Encontrada</h1>
        <p className="text-muted-foreground">La factura que intentas editar no existe o no se pudo encontrar.</p>
        <Button onClick={() => router.push('/billing')} className="mt-4">Volver a Facturación</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Editar Factura ID: {invoiceId.substring(0,8).toUpperCase()}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingClients || !!clientError}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingClients ? "Cargando clientes..." : (clientError ? "Error al cargar clientes" : "Seleccionar un cliente")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {clientError && <div className="p-2 text-sm text-destructive flex items-center"><AlertTriangle className="h-4 w-4 mr-2" /> {clientError}</div>}
                      {!isLoadingClients && !clientError && clientsList.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {invoiceStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issuedDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Emisión</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Vencimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ítems de la Factura</h2>
            {fields.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end p-3 border rounded-md bg-secondary/30">
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-5">
                      {index === 0 && <FormLabel>Descripción</FormLabel>}
                      <FormControl>
                        <Input placeholder="Descripción del servicio/producto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                       {index === 0 && <FormLabel>Cantidad</FormLabel>}
                      <FormControl>
                        <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                       {index === 0 && <FormLabel>Precio Unit.</FormLabel>}
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="md:col-span-2 flex items-end justify-end">
                    {fields.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="h-9 w-9">
                        <Trash2 className="h-4 w-4 text-destructive-foreground" />
                    </Button>
                    )}
                 </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: `item-${itemIdCounter++}-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 })}
            >
              <PlusCircle className="mr-2 h-4 w-4 text-green-600" /> Agregar Ítem
            </Button>
          </div>

          <div className="text-right text-xl font-semibold">
            Total: {totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Términos de pago, agradecimientos, etc." {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting || isLoadingInvoice || isLoadingClients}>
            {form.formState.isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
