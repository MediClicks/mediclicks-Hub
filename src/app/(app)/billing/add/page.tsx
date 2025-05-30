
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
import { CalendarIcon, PlusCircle, Trash2, AlertTriangle, PackagePlus, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { InvoiceStatus, Client, WithConvertedDates, ContractedServiceClient } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, Timestamp, doc, getDoc, deleteField } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';


const invoiceStatuses: InvoiceStatus[] = ['No Pagada', 'Pagada', 'Vencida'];

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
  taxRate: z.coerce.number().min(0, "La tasa no puede ser negativa.").optional().default(0),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

let itemIdCounter = 0;

// Recursive timestamp converter
function convertClientTimestampsToDates<T extends Record<string, any>>(docData: T | undefined): WithConvertedDates<T> | undefined {
  if (!docData) return undefined;
  const data = { ...docData } as any; // Use 'any' for easier manipulation internally
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value instanceof Timestamp) {
        data[key] = value.toDate();
      } else if (Array.isArray(value)) {
        data[key] = value.map((item: any) =>
          typeof item === 'object' && item !== null && !(item instanceof Date)
            ? convertClientTimestampsToDates(item) // Recursively convert objects in arrays
            : item
        );
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        data[key] = convertClientTimestampsToDates(value); // Recursively convert nested objects
      }
    }
  }
  // Ensure contractedServices is an array
  if (data.hasOwnProperty('contractedServices') && !Array.isArray(data['contractedServices' as keyof T])) {
    (data['contractedServices' as keyof T] as any) = [];
  } else if (!data.hasOwnProperty('contractedServices')) {
    (data['contractedServices' as keyof T] as any) = [];
  }

  return data as WithConvertedDates<T>;
}


export default function AddInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [clientsList, setClientsList] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);

  const [selectedClientDetails, setSelectedClientDetails] = useState<WithConvertedDates<Client> | null>(null);
  const [isLoadingSelectedClient, setIsLoadingSelectedClient] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      status: 'No Pagada',
      items: [{ id: `item-${itemIdCounter++}-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }],
      clientId: '',
      taxRate: 0,
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const fetchClientsForDropdown = useCallback(async () => {
    setIsLoadingClients(true);
    setClientError(null);
    try {
      const clientsCollection = collection(db, "clients");
      const q = query(clientsCollection, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedClients = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const convertedData = convertClientTimestampsToDates(data as Client) || (data as Client); 
        return { id: docSnap.id, ...convertedData } as WithConvertedDates<Client>;
      });
      setClientsList(fetchedClients);
    } catch (err) {
      console.error("Error fetching clients for dropdown: ", err);
      setClientError('No se pudieron cargar los clientes para el selector.');
      toast({
        title: 'Error al Cargar Clientes',
        description: 'No se pudieron cargar los clientes. Intenta recargar.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingClients(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClientsForDropdown();
  }, [fetchClientsForDropdown]);

  const watchedClientId = form.watch('clientId');

  useEffect(() => {
    const fetchSelectedClientDetails = async () => {
      if (watchedClientId) {
        setIsLoadingSelectedClient(true);
        setSelectedClientDetails(null);
        try {
          const clientDocRef = doc(db, "clients", watchedClientId);
          const docSnap = await getDoc(clientDocRef);
          if (docSnap.exists()) {
            const clientDataFromFirestore = docSnap.data() as Client;
            const clientData = convertClientTimestampsToDates(clientDataFromFirestore);
            setSelectedClientDetails({ 
              id: docSnap.id, 
              ...(clientData || {}),
              contractedServices: Array.isArray(clientData?.contractedServices) ? clientData.contractedServices : [],
            } as WithConvertedDates<Client>);
          } else {
            toast({ title: 'Error', description: 'Cliente seleccionado no encontrado.', variant: 'destructive' });
          }
        } catch (error) {
          console.error("Error fetching selected client details: ", error);
          toast({ title: 'Error', description: 'No se pudieron cargar los detalles del cliente seleccionado.', variant: 'destructive' });
        } finally {
          setIsLoadingSelectedClient(false);
        }
      } else {
        setSelectedClientDetails(null);
      }
    };

    if (watchedClientId) {
        fetchSelectedClientDetails();
    } else {
        setSelectedClientDetails(null); // Clear if no client is selected
    }
  }, [watchedClientId, toast]);


  const watchedItems = form.watch('items');
  const watchedTaxRate = form.watch('taxRate');

  const subtotal = watchedItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
  const taxRateDecimal = (watchedTaxRate || 0) / 100;
  const calculatedTaxAmount = subtotal * taxRateDecimal;
  const totalAmountWithTax = subtotal + calculatedTaxAmount;


  const addClientServicesToInvoice = () => {
    if (selectedClientDetails && Array.isArray(selectedClientDetails.contractedServices) && selectedClientDetails.contractedServices.length > 0) {
      const currentItemDescriptions = new Set(fields.map(item => item.description));
      let servicesAddedCount = 0;

      selectedClientDetails.contractedServices.forEach((service: ContractedServiceClient) => {
        if (!currentItemDescriptions.has(service.serviceName)) {
          append({
            id: `item-${itemIdCounter++}-${Date.now()}`,
            description: service.serviceName,
            quantity: 1,
            unitPrice: service.price,
          });
          servicesAddedCount++;
        }
      });

      if (servicesAddedCount > 0) {
        toast({
          title: 'Servicios Agregados',
          description: `${servicesAddedCount} servicio(s) contratado(s) por ${selectedClientDetails.name} se han añadido a la factura.`,
        });
      } else {
         toast({
          title: 'Servicios No Agregados',
          description: `Todos los servicios contratados por ${selectedClientDetails.name} ya están en la factura o no tiene servicios para agregar.`,
          variant: 'default',
        });
      }
    } else {
      toast({
        title: 'Sin Servicios Contratados',
        description: `${selectedClientDetails?.name || 'El cliente seleccionado'} no tiene servicios contratados registrados para agregar.`,
        variant: 'default',
      });
    }
  };


  async function onSubmit(data: InvoiceFormValues) {
    form.clearErrors();
    try {
      const clientName = clientsList.find(c => c.id === data.clientId)?.name;

      const currentSubtotal = data.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
      const currentTaxRateDecimal = (data.taxRate || 0) / 100;
      const currentCalculatedTaxAmount = currentSubtotal * currentTaxRateDecimal;
      const currentFinalTotalAmount = currentSubtotal + currentCalculatedTaxAmount;


      const invoiceData: Record<string, any> = {
        clientId: data.clientId,
        issuedDate: Timestamp.fromDate(data.issuedDate),
        dueDate: Timestamp.fromDate(data.dueDate),
        status: data.status,
        items: data.items.map(({ id, ...rest }) => rest), 
        taxRate: data.taxRate || 0,
        taxAmount: currentCalculatedTaxAmount,
        totalAmount: currentFinalTotalAmount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      if (clientName) {
        invoiceData.clientName = clientName;
      }

      if (data.notes && data.notes.trim() !== '') {
        invoiceData.notes = data.notes;
      } else {
        invoiceData.notes = deleteField();
      }
      
      const docRef = await addDoc(collection(db, 'invoices'), invoiceData);

      toast({
        title: 'Factura Creada',
        description: `La factura "${docRef.id.substring(0,8).toUpperCase()}" para ${clientName || 'el cliente seleccionado'} ha sido creada.`,
      });
      router.push('/billing');

    } catch (e) {
      console.error('Error al agregar factura a Firestore: ', e);
      toast({
        title: 'Error al Guardar Factura',
        description: 'Hubo un problema al guardar la factura. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Crear Nueva Factura</h1>
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
                    disabled={isLoadingClients || !!clientError || form.formState.isSubmitting}
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={form.formState.isSubmitting}>
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
                          disabled={form.formState.isSubmitting}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} disabled={form.formState.isSubmitting}/>
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
                          disabled={form.formState.isSubmitting}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} disabled={form.formState.isSubmitting}/>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem className="md:col-span-2"> {/* Span across two columns if needed */}
                    <FormLabel>Tasa de Impuesto (%) (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ej: 16"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        value={field.value || 0}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          {watchedClientId && selectedClientDetails && Array.isArray(selectedClientDetails.contractedServices) && selectedClientDetails.contractedServices.length > 0 && (
            <Card className="mt-6 bg-secondary/30 border-primary/30">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-md flex items-center">
                  <PackagePlus className="mr-2 h-5 w-5 text-primary" />
                  Sugerencias para {selectedClientDetails.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Este cliente tiene {selectedClientDetails.contractedServices.length} servicio(s) contratado(s).
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addClientServicesToInvoice}
                  disabled={isLoadingSelectedClient || form.formState.isSubmitting}
                >
                  {isLoadingSelectedClient ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4 text-green-600" />}
                  Agregar Servicios Contratados a la Factura
                </Button>
              </CardContent>
            </Card>
          )}
           {watchedClientId && isLoadingSelectedClient && (
             <div className="flex items-center justify-center text-sm text-muted-foreground py-3">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando servicios del cliente...
             </div>
           )}


          <div className="space-y-4 pt-4">
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
                        <Input placeholder="Descripción del servicio/producto" {...field} disabled={form.formState.isSubmitting}/>
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
                        <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={form.formState.isSubmitting}/>
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
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={form.formState.isSubmitting}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="md:col-span-2 flex items-end justify-end">
                    {fields.length > 0 && ( // Only show remove button if there are items
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="h-9 w-9" disabled={form.formState.isSubmitting}>
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
              disabled={form.formState.isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4 text-green-600" /> Agregar Ítem Manualmente
            </Button>
             {form.formState.errors.items && !form.formState.errors.items.root && form.formState.errors.items.message && (
                 <p className="text-sm font-medium text-destructive">{form.formState.errors.items.message}</p>
            )}
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="space-y-1 text-right text-sm">
              <div className="flex justify-end gap-4">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="w-32 text-right font-medium">{subtotal.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-muted-foreground">Impuestos ({watchedTaxRate || 0}%):</span>
                <span className="w-32 text-right font-medium">{calculatedTaxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <Separator className="my-2"/>
              <div className="flex justify-end gap-4 text-lg font-semibold text-primary">
                <span>TOTAL:</span>
                <span className="w-32 text-right">{totalAmountWithTax.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
              </div>
            </div>
          </div>


          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Términos de pago, agradecimientos, etc." {...field} value={field.value || ''} disabled={form.formState.isSubmitting}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting || isLoadingClients || isLoadingSelectedClient}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {form.formState.isSubmitting ? 'Guardando Factura...' : 'Guardar Factura'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
