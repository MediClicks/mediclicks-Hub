
'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { CalendarIcon, PlusCircle, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase'; 
import { collection, addDoc, serverTimestamp, Timestamp, getDocs, query, orderBy, deleteField, FieldValue } from 'firebase/firestore';
import type { Client, ContractedServiceClient, SocialMediaAccountClient, PaymentModality, ServiceDefinition, WithConvertedDates, TaskPriority, TaskStatus } from '@/types';

const paymentModalities: PaymentModality[] = ['Único', 'Mensual', 'Trimestral', 'Anual'];

let serviceItemIdCounter = 0;
let socialItemIdCounter = 0;

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
  profileSummary: z.string().optional(),
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

// Recursive timestamp converter for ServiceDefinition
function convertTimestampsRecursively<T extends Record<string, any>>(docData: T | undefined): WithConvertedDates<T> | undefined {
  if (!docData) return undefined;
  const data = { ...docData } as any;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value instanceof Timestamp) {
        data[key] = value.toDate();
      } else if (Array.isArray(value)) {
        data[key] = value.map((item: any) =>
          typeof item === 'object' && item !== null && !(item instanceof Date)
            ? convertTimestampsRecursively(item) // Recursively convert objects in arrays
            : item
        );
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        data[key] = convertTimestampsRecursively(value); // Recursively convert nested objects
      }
    }
  }
  return data as WithConvertedDates<T>;
}


export default function AddClientPage() {
  const router = useRouter();
  const { toast } = useToast();

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
      contractStartDate: new Date(),
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
  
  const fetchServiceDefinitions = useCallback(async () => {
      setIsLoadingServices(true);
      setServiceError(null);
      try {
        const servicesCollection = collection(db, "appServices");
        const q = query(servicesCollection, orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        const fetchedServices = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data() as ServiceDefinition; 
          return { id: docSnap.id, ...convertTimestampsRecursively(data) };
        });
        setServiceDefinitions(fetchedServices);
      } catch (err) {
        console.error("Error fetching service definitions: ", err);
        setServiceError('No se pudieron cargar las definiciones de servicios.');
        toast({
          title: "Error al Cargar Servicios",
          description: "No se pudieron cargar las definiciones de servicios para el selector.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingServices(false);
      }
    }, [toast]);

  useEffect(() => {
    fetchServiceDefinitions();
  }, [fetchServiceDefinitions]);

  async function onSubmit(data: ClientFormValues) {
    form.clearErrors();
    
    const dataToSave: Record<string, any> = {
      name: data.name,
      email: data.email,
      contractStartDate: Timestamp.fromDate(data.contractStartDate),
      pagado: data.pagado || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Handle optional string fields
    const optionalStringFields: (keyof ClientFormValues)[] = [
      'avatarUrl', 'clinica', 'telefono', 'profileSummary',
      'dominioWeb', 'tipoServicioWeb', 'credencialesRedesUsuario', 'credencialesRedesContrasena'
    ];
    optionalStringFields.forEach(key => {
      const value = data[key as keyof ClientFormValues] as string | undefined;
      if (typeof value === 'string' && value.trim() !== '') {
        dataToSave[key] = value;
      }
    });
    
    if (data.vencimientoWeb instanceof Date && !isNaN(data.vencimientoWeb.getTime())) {
      dataToSave.vencimientoWeb = Timestamp.fromDate(data.vencimientoWeb);
    }

    if (data.contractedServices && data.contractedServices.length > 0) {
      dataToSave.contractedServices = data.contractedServices.map(({ id, ...rest }) => rest); 
    }

    if (data.socialMediaAccounts && data.socialMediaAccounts.length > 0) {
      dataToSave.socialMediaAccounts = data.socialMediaAccounts.map(({ id, password, ...rest }) => {
        const account: any = { ...rest };
        if (typeof password === 'string' && password.trim() !== '') {
          account.password = password;
        }
        return account;
      });
    }
        
    try {
      const docRef = await addDoc(collection(db, 'clients'), dataToSave);
      // console.log('Nuevo cliente guardado con ID: ', docRef.id); // Removed debug log

      toast({
        title: 'Cliente Creado',
        description: `El cliente ${data.name} ha sido agregado exitosamente.`,
      });

      // Create automatic tasks for each contracted service
      if (dataToSave.contractedServices && dataToSave.contractedServices.length > 0) {
        for (const service of dataToSave.contractedServices as Omit<ContractedServiceClient, 'id'>[]) {
          const newTaskData = {
            name: `Configurar servicio: ${service.serviceName} para ${data.name}`,
            description: `Iniciar configuración para "${service.serviceName}" (Precio: ${service.price.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })} ${service.paymentModality}) contratado por ${data.name}. Incluir verificación de pago y bienvenida.`,
            assignedTo: "Equipo de Cuentas",
            clientId: docRef.id,
            clientName: data.name,
            dueDate: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), 
            priority: 'Media' as TaskPriority,
            status: 'Pendiente' as TaskStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await addDoc(collection(db, 'tasks'), newTaskData);
          toast({
            title: "Tarea Automática Creada",
            description: `Se creó una tarea para configurar el servicio "${service.serviceName}" para ${data.name}.`,
            duration: 4000,
          });
        }
      }

      router.push('/clients');
    } catch (e: any) {
      console.error('Error al agregar cliente a Firestore: ', e);
      toast({
        title: 'Error al Guardar',
        description: `Hubo un problema al guardar el cliente: ${e.message || 'Por favor, intenta de nuevo.'}`,
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Agregar Nuevo Cliente</h1>
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
                    <Input placeholder="Ej: Clínica Dental Sonrisas" {...field} disabled={form.formState.isSubmitting} />
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
                    <Input type="email" placeholder="Ej: contacto@sonrisas.com" {...field} disabled={form.formState.isSubmitting}/>
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
                    <Input type="url" placeholder="https://ejemplo.com/logo.png" {...field} value={field.value || ''} disabled={form.formState.isSubmitting}/>
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
                    <Input placeholder="Ej: Sonrisas Centro" {...field} value={field.value || ''} disabled={form.formState.isSubmitting}/>
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
                    <Input placeholder="Ej: +34 900 123 456" {...field} value={field.value || ''} disabled={form.formState.isSubmitting}/>
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
                          disabled={form.formState.isSubmitting}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
          </div>

          <h2 className="text-xl font-semibold border-b pb-2 mt-6">Perfil del Cliente (para IA)</h2>
          <FormField
            control={form.control}
            name="profileSummary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resumen del Perfil (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe la marca, valores, público objetivo, tono deseado, etc." className="resize-y min-h-[100px]" {...field} value={field.value || ''} disabled={form.formState.isSubmitting}/>
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
                        disabled={isLoadingServices || !!serviceError || serviceDefinitions.length === 0 || form.formState.isSubmitting}
                      >
                        <FormControl>
                           <SelectTrigger>
                             <SelectValue 
                                placeholder={
                                  isLoadingServices ? "Cargando servicios..." :  
                                  (serviceError ? "Error al cargar servicios" : 
                                  (serviceDefinitions.length === 0 ? "No hay servicios definidos. Crea uno en Configuración." : "Seleccionar servicio"))
                                } 
                              />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceError && <div className="p-2 text-sm text-destructive flex items-center"><AlertTriangle className="h-4 w-4 mr-2" /> {serviceError}</div>}
                          {!isLoadingServices && !serviceError && serviceDefinitions.length === 0 && <div className="p-2 text-sm text-muted-foreground">No hay servicios. Crea uno en Configuración.</div>}
                          {!isLoadingServices && !serviceError && serviceDefinitions.map(serviceDef => (
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
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={form.formState.isSubmitting}/>
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
                      <Select onValueChange={field.onChange} value={field.value} disabled={form.formState.isSubmitting}>
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
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeService(index)} className="h-9 w-9" disabled={form.formState.isSubmitting}>
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
              disabled={isLoadingServices || !!serviceError || serviceDefinitions.length === 0 || form.formState.isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4 text-green-600" /> Agregar Servicio
            </Button>
             {form.formState.errors.contractedServices && !form.formState.errors.contractedServices.root && typeof form.formState.errors.contractedServices.message === 'string' && (
                 <p className="text-sm font-medium text-destructive">{form.formState.errors.contractedServices.message}</p>
            )}
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
                    <Input placeholder="Ej: www.sonrisas.com" {...field} value={field.value || ''} disabled={form.formState.isSubmitting}/>
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
                    <Input placeholder="Ej: Hosting Compartido Pro" {...field} value={field.value || ''} disabled={form.formState.isSubmitting}/>
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
                          className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}
                          disabled={form.formState.isSubmitting}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={(date) => field.onChange(date || null)} initialFocus locale={es} disabled={form.formState.isSubmitting}/>
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
                        <Input placeholder="Ej: Instagram" {...field} disabled={form.formState.isSubmitting}/>
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
                        <Input placeholder="Nombre de usuario" {...field} disabled={form.formState.isSubmitting}/>
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
                        <Input type="password" placeholder="Contraseña" {...field} value={field.value || ''} disabled={form.formState.isSubmitting}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="md:col-span-2 flex items-end justify-end">
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSocial(index)} className="h-9 w-9" disabled={form.formState.isSubmitting}>
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
              disabled={form.formState.isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4 text-green-600" /> Agregar Cuenta Social
            </Button>
            <FormDescription className="text-xs text-muted-foreground">
              Por seguridad, considere usar un gestor de contraseñas seguro y no almacenar contraseñas sensibles directamente aquí si es posible.
            </FormDescription>
          </div>
          
          <FormField
              control={form.control}
              name="credencialesRedesUsuario"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>Usuario Credenciales RRSS (Legacy)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} disabled={form.formState.isSubmitting}/>
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
                  <Input type="password" {...field} value={field.value || ''} disabled={form.formState.isSubmitting}/>
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
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={form.formState.isSubmitting}/>
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
          <Button type="submit" disabled={form.formState.isSubmitting || isLoadingServices}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {form.formState.isSubmitting ? 'Guardando Cliente...' : 'Guardar Cliente'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
