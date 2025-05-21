
'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp, deleteField, collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { Client, ContractedServiceClient, SocialMediaAccountClient, PaymentModality, ServiceDefinition, WithConvertedDates } from '@/types';

const paymentModalities: PaymentModality[] = ['Único', 'Mensual', 'Trimestral', 'Anual'];

let serviceItemIdCounter = 0;
let socialItemIdCounter = 0;

// Schemas for form validation including client-side ID for useFieldArray
const contractedServiceClientSchema = z.object({
  id: z.string(), 
  serviceName: z.string().min(1, { message: 'Debe seleccionar un servicio.' }),
  price: z.coerce.number().min(0, { message: 'El precio no puede ser negativo.' }),
  paymentModality: z.enum(paymentModalities, { required_error: 'La modalidad de pago es obligatoria.' }),
});

const socialMediaAccountClientSchema = z.object({
  id: z.string(), 
  platform: z.string().min(1, { message: 'La plataforma es obligatoria.' }),
  username: z.string().min(1, { message: 'El usuario es obligatorio.' }),
  password: z.string().optional(),
});

const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  avatarUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
  clinica: z.string().optional(),
  telefono: z.string().optional(),
  contractStartDate: z.date({ required_error: 'La fecha de inicio de contrato es obligatoria.' }),
  profileSummary: z.string().min(10, { message: 'El resumen del perfil debe tener al menos 10 caracteres.' }).optional(),
  pagado: z.boolean().default(false).optional(),
  dominioWeb: z.string().optional(),
  tipoServicioWeb: z.string().optional(),
  vencimientoWeb: z.date().optional().nullable(),
  contractedServices: z.array(contractedServiceClientSchema).optional(),
  socialMediaAccounts: z.array(socialMediaAccountClientSchema).optional(),
  credencialesRedesUsuario: z.string().optional(), 
  credencialesRedesContrasena: z.string().optional(), 
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

// Function to convert Firestore Timestamps to JS Date objects
function convertServiceDefinitionTimestamps(docData: any): WithConvertedDates<ServiceDefinition> {
   const data = { ...docData } as Partial<WithConvertedDates<ServiceDefinition>>;
  for (const key in data) {
    if (data[key as keyof ServiceDefinition] instanceof Timestamp) {
      data[key as keyof ServiceDefinition] = (data[key as keyof ServiceDefinition] as Timestamp).toDate() as any;
    }
  }
  return data as WithConvertedDates<ServiceDefinition>;
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const clientId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [clientNotFound, setClientNotFound] = useState(false);

  const [serviceDefinitions, setServiceDefinitions] = useState<WithConvertedDates<ServiceDefinition>[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      email: '',
      avatarUrl: '',
      clinica: '',
      telefono: '',
      profileSummary: '',
      pagado: false,
      dominioWeb: '',
      tipoServicioWeb: '',
      vencimientoWeb: null,
      contractedServices: [],
      socialMediaAccounts: [],
      credencialesRedesUsuario: '',
      credencialesRedesContrasena: '',
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "contractedServices"
  });

  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
    control: form.control,
    name: "socialMediaAccounts"
  });
  
  useEffect(() => {
    const fetchServiceDefinitions = async () => {
      setIsLoadingServices(true);
      setServiceError(null);
      try {
        const servicesCollection = collection(db, "appServices");
        const q = query(servicesCollection, orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        const fetchedServices = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...convertServiceDefinitionTimestamps(data) };
        });
        setServiceDefinitions(fetchedServices);
      } catch (err) {
        console.error("Error fetching service definitions: ", err);
        setServiceError('No se pudieron cargar las definiciones de servicios.');
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServiceDefinitions();
  }, []);

  useEffect(() => {
    if (clientId) {
      const fetchClient = async () => {
        setIsLoading(true);
        setClientNotFound(false);
        try {
          const clientDocRef = doc(db, 'clients', clientId);
          const docSnap = await getDoc(clientDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as Client;
            
            serviceItemIdCounter = data.contractedServices?.length || 0;
            socialItemIdCounter = data.socialMediaAccounts?.length || 0;

            const formData: ClientFormValues = {
              name: data.name || '',
              email: data.email || '',
              avatarUrl: data.avatarUrl || '',
              clinica: data.clinica || '',
              telefono: data.telefono || '',
              contractStartDate: data.contractStartDate ? (data.contractStartDate as Timestamp).toDate() : new Date(),
              profileSummary: data.profileSummary || '',
              pagado: data.pagado || false,
              dominioWeb: data.dominioWeb || '',
              tipoServicioWeb: data.tipoServicioWeb || '',
              vencimientoWeb: data.vencimientoWeb ? (data.vencimientoWeb as Timestamp).toDate() : null,
              contractedServices: (data.contractedServices || []).map((service, index) => ({
                ...service,
                id: `service-${index}-${Date.now()}` 
              })),
              socialMediaAccounts: (data.socialMediaAccounts || []).map((account, index) => ({
                ...account,
                id: `social-${index}-${Date.now()}` 
              })),
              credencialesRedesUsuario: data.credencialesRedesUsuario || '',
              credencialesRedesContrasena: data.credencialesRedesContrasena || '',
            };
            form.reset(formData);
          } else {
            setClientNotFound(true);
            toast({ title: 'Error', description: 'Cliente no encontrado.', variant: 'destructive' });
            router.push('/clients');
          }
        } catch (error) {
          console.error("Error fetching client: ", error);
          toast({ title: 'Error', description: 'No se pudo cargar la información del cliente.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchClient();
    } else {
      setIsLoading(false);
      setClientNotFound(true);
       toast({ title: 'Error', description: 'ID de cliente no válido.', variant: 'destructive' });
       router.push('/clients');
    }
  }, [clientId, toast, form, router]);

  async function onSubmit(data: ClientFormValues) {
    form.clearErrors();
    try {
      const clientDocRef = doc(db, 'clients', clientId);
      
      const dataToUpdate: Record<string, any> = {
        name: data.name,
        email: data.email,
        contractStartDate: data.contractStartDate ? Timestamp.fromDate(data.contractStartDate) : deleteField(),
        pagado: data.pagado,
        updatedAt: serverTimestamp(),
      };

      // Handle optional fields
      (Object.keys(data) as Array<keyof ClientFormValues>).forEach(key => {
         if (key === 'name' || key === 'email' || key === 'contractStartDate' || key === 'pagado' || 
            key === 'contractedServices' || key === 'socialMediaAccounts') {
          return; 
        }
        if (key === 'vencimientoWeb') {
          dataToUpdate[key] = data[key] ? Timestamp.fromDate(data[key] as Date) : deleteField();
        } else if (data[key] !== undefined && data[key] !== '' && data[key] !== null) {
          dataToUpdate[key] = data[key];
        } else {
          dataToUpdate[key] = deleteField();
        }
      });
      
      // Handle contractedServices: remove client-side id
      if (data.contractedServices && data.contractedServices.length > 0) {
        dataToUpdate.contractedServices = data.contractedServices.map(({ id, ...rest }) => rest);
      } else {
        dataToUpdate.contractedServices = deleteField(); 
      }

      // Handle socialMediaAccounts: remove client-side id and optional empty password
      if (data.socialMediaAccounts && data.socialMediaAccounts.length > 0) {
        dataToUpdate.socialMediaAccounts = data.socialMediaAccounts.map(({ id, password, ...rest }) => {
          const account: any = {...rest};
          if(password && password.trim() !== '') account.password = password;
          return account;
        });
      } else {
        dataToUpdate.socialMediaAccounts = deleteField(); 
      }
      
      await updateDoc(clientDocRef, dataToUpdate);

      toast({
        title: 'Cliente Actualizado',
        description: `El cliente ${data.name} ha sido actualizado exitosamente.`,
      });
      router.push('/clients');
    } catch (e) {
      console.error('Error al actualizar cliente en Firestore: ', e);
      toast({
        title: 'Error al Guardar',
        description: 'Hubo un problema al actualizar el cliente. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }

  if (isLoading || isLoadingServices) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando datos del cliente...</p>
      </div>
    );
  }

  if (clientNotFound) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Cliente no Encontrado</h1>
        <p className="text-muted-foreground">El cliente que intentas editar no existe o no se pudo encontrar.</p>
        <Button onClick={() => router.push('/clients')} className="mt-4">Volver a Clientes</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Editar Cliente: {form.watch('name')}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <h2 className="text-xl font-semibold border-b pb-2 mt-6">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo / Razón Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Clínica Dental Sonrisas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Contacto</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Ej: contacto@sonrisas.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Avatar (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://ejemplo.com/logo.png" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clinica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Clínica (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Sonrisas Centro" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: +34 900 123 456" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="contractStartDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha Inicio Contrato</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date('1900-01-01')} initialFocus locale={es} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <h2 className="text-xl font-semibold border-b pb-2 mt-6">Perfil del Cliente (para IA)</h2>
          <FormField
            control={form.control}
            name="profileSummary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resumen del Perfil (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe la marca, valores, público objetivo, tono deseado, etc." className="resize-y min-h-[100px]" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>Esta información ayudará a generar mejores sugerencias de contenido.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <h2 className="text-xl font-semibold border-b pb-2 mt-6">Servicios Contratados</h2>
          <div className="space-y-4">
            {serviceFields.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end p-3 border rounded-md bg-secondary/30">
                <FormField
                  control={form.control}
                  name={`contractedServices.${index}.serviceName`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-4">
                      {index === 0 && <FormLabel>Nombre Servicio/Paquete</FormLabel>}
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selectedService = serviceDefinitions.find(s => s.name === value);
                          if (selectedService) {
                            form.setValue(`contractedServices.${index}.price`, selectedService.price);
                            form.setValue(`contractedServices.${index}.paymentModality`, selectedService.paymentModality);
                          }
                        }}
                        value={field.value}
                        disabled={isLoadingServices || !!serviceError}
                      >
                        <FormControl>
                           <SelectTrigger>
                            <SelectValue placeholder={
                              isLoadingServices ? "Cargando servicios..." : 
                              (serviceError ? "Error al cargar" : 
                              (serviceDefinitions.length === 0 ? "No hay servicios definidos" : "Seleccionar servicio"))
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceError && <div className="p-2 text-sm text-destructive flex items-center"><AlertTriangle className="h-4 w-4 mr-2" /> {serviceError}</div>}
                          {!isLoadingServices && !serviceError && serviceDefinitions.length === 0 && <div className="p-2 text-sm text-muted-foreground">No hay servicios. Crea uno en Configuración.</div>}
                          {serviceDefinitions.map(serviceDef => (
                            <SelectItem key={serviceDef.id} value={serviceDef.name}>{serviceDef.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`contractedServices.${index}.price`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                       {index === 0 && <FormLabel>Precio</FormLabel>}
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`contractedServices.${index}.paymentModality`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      {index === 0 && <FormLabel>Modalidad Pago</FormLabel>}
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar modalidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentModalities.map(modality => (
                            <SelectItem key={modality} value={modality}>{modality}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="md:col-span-2 flex items-end justify-end">
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeService(index)} className="h-9 w-9">
                        <Trash2 className="h-4 w-4 text-destructive-foreground" />
                    </Button>
                 </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendService({ id: `service-${serviceItemIdCounter++}-${Date.now()}`, serviceName: '', price: 0, paymentModality: 'Mensual' })}
            >
              <PlusCircle className="mr-2 h-4 w-4 text-green-600" /> Agregar Servicio
            </Button>
          </div>

          <h2 className="text-xl font-semibold border-b pb-2 mt-6">Información Web</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="dominioWeb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dominio Web (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: www.sonrisas.com" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipoServicioWeb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Servicio Web (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Hosting Compartido Pro" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vencimientoWeb"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Vencimiento Servicio Web (Opcional)</FormLabel>
                   <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={(date) => field.onChange(date || null)} initialFocus locale={es} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <h2 className="text-xl font-semibold border-b pb-2 mt-6">Cuentas de Redes Sociales</h2>
          <div className="space-y-4">
            {socialFields.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-end p-3 border rounded-md bg-secondary/30">
                <FormField
                  control={form.control}
                  name={`socialMediaAccounts.${index}.platform`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      {index === 0 && <FormLabel>Plataforma</FormLabel>}
                      <FormControl>
                        <Input placeholder="Ej: Instagram" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`socialMediaAccounts.${index}.username`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-4">
                       {index === 0 && <FormLabel>Usuario</FormLabel>}
                      <FormControl>
                        <Input placeholder="Nombre de usuario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`socialMediaAccounts.${index}.password`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                       {index === 0 && <FormLabel>Contraseña (Opcional)</FormLabel>}
                      <FormControl>
                        <Input type="password" placeholder="Contraseña" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="md:col-span-2 flex items-end justify-end">
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSocial(index)} className="h-9 w-9">
                        <Trash2 className="h-4 w-4 text-destructive-foreground" />
                    </Button>
                 </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSocial({ id: `social-${socialItemIdCounter++}-${Date.now()}`, platform: '', username: '', password: '' })}
            >
              <PlusCircle className="mr-2 h-4 w-4 text-green-600" /> Agregar Cuenta Social
            </Button>
            <FormDescription className="text-xs text-muted-foreground">
              Por seguridad, considere usar un gestor de contraseñas seguro y no almacenar contraseñas sensibles directamente aquí si es posible.
            </FormDescription>
          </div>
          
          {/* Legacy Social Fields - Kept for potential backward compatibility, can be removed if not needed */}
          <FormField
              control={form.control}
              name="credencialesRedesUsuario"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>Usuario Credenciales RRSS (Legacy)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''}/>
                  </FormControl>
                </FormItem>
              )}
            />
          <FormField
            control={form.control}
            name="credencialesRedesContrasena"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormLabel>Contraseña Credenciales RRSS (Legacy)</FormLabel>
                <FormControl>
                  <Input type="password" {...field} value={field.value || ''}/>
                </FormControl>
              </FormItem>
            )}
          />


          <h2 className="text-xl font-semibold border-b pb-2 mt-6">Otros</h2>
          <FormField
            control={form.control}
            name="pagado"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>¿Cliente al día con los pagos?</FormLabel>
                  <FormDescription>
                    Marcar si el cliente no tiene facturas pendientes importantes.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting || isLoading || isLoadingServices}>
            {form.formState.isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
