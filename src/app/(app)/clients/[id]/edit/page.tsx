
'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp, deleteField } from 'firebase/firestore';
import type { Client } from '@/types';

const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  clinica: z.string().optional(),
  telefono: z.string().optional(),
  contractStartDate: z.date({ required_error: 'La fecha de inicio de contrato es obligatoria.' }),
  nextBillingDate: z.date({ required_error: 'La próxima fecha de facturación es obligatoria.' }),
  profileSummary: z.string().min(10, { message: 'El resumen del perfil debe tener al menos 10 caracteres.' }).optional(),
  serviciosActivosGeneral: z.string().optional(),
  pagado: z.boolean().default(false).optional(),
  notas: z.string().optional(),
  dominioWeb: z.string().optional(),
  tipoServicioWeb: z.string().optional(),
  vencimientoWeb: z.date().optional().nullable(), 
  plataformasRedesSociales: z.string().optional(),
  detallesRedesSociales: z.string().optional(),
  serviciosContratadosAdicionales: z.string().optional(),
  configuracionRedesSociales: z.string().optional(),
  credencialesRedesUsuario: z.string().optional(),
  credencialesRedesContrasena: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const clientId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [clientNotFound, setClientNotFound] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { 
      name: '',
      email: '',
      clinica: '',
      telefono: '',
      profileSummary: '',
      serviciosActivosGeneral: '',
      pagado: false,
      notas: '',
      dominioWeb: '',
      tipoServicioWeb: '',
      vencimientoWeb: null, 
      plataformasRedesSociales: '',
      detallesRedesSociales: '',
      serviciosContratadosAdicionales: '',
      configuracionRedesSociales: '',
      credencialesRedesUsuario: '',
      credencialesRedesContrasena: '',
    },
  });

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
            
            const formData: ClientFormValues = {
              name: data.name || '',
              email: data.email || '',
              clinica: data.clinica || '',
              telefono: data.telefono || '',
              contractStartDate: data.contractStartDate ? (data.contractStartDate as Timestamp).toDate() : new Date(),
              nextBillingDate: data.nextBillingDate ? (data.nextBillingDate as Timestamp).toDate() : new Date(),
              profileSummary: data.profileSummary || '',
              serviciosActivosGeneral: data.serviciosActivosGeneral || '',
              pagado: data.pagado || false,
              notas: data.notas || '',
              dominioWeb: data.dominioWeb || '',
              tipoServicioWeb: data.tipoServicioWeb || '',
              vencimientoWeb: data.vencimientoWeb ? (data.vencimientoWeb as Timestamp).toDate() : null,
              plataformasRedesSociales: data.plataformasRedesSociales || '',
              detallesRedesSociales: data.detallesRedesSociales || '',
              serviciosContratadosAdicionales: data.serviciosContratadosAdicionales || '',
              configuracionRedesSociales: data.configuracionRedesSociales || '',
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
      
      const dataToUpdate: Record<string, any> = {};
      (Object.keys(data) as Array<keyof ClientFormValues>).forEach(key => {
        if (data[key] !== undefined && data[key] !== '') {
          dataToUpdate[key] = data[key];
        } else if (key === 'vencimientoWeb' && data[key] === null) {
            dataToUpdate[key] = deleteField(); // Explicitly delete if date is cleared to null
        } else if (data[key] === '' && key !== 'vencimientoWeb') {
             dataToUpdate[key] = deleteField(); // Delete other empty string fields
        }
      });
      
      if (data.vencimientoWeb === null) {
        dataToUpdate.vencimientoWeb = deleteField();
      } else if (data.vencimientoWeb instanceof Date){
        dataToUpdate.vencimientoWeb = data.vencimientoWeb;
      } else {
        // If it was undefined initially and not touched, it won't be in dataToUpdate
        // If it was a date and then somehow became undefined (unlikely with picker), this also handles it
        if (!('vencimientoWeb' in dataToUpdate)) delete dataToUpdate.vencimientoWeb;
      }
      
      dataToUpdate.updatedAt = serverTimestamp();

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

  if (isLoading) {
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
              name="clinica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Clínica (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Sonrisas Centro" {...field} />
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
                    <Input placeholder="Ej: +34 900 123 456" {...field} />
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
            <FormField
              control={form.control}
              name="nextBillingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Próxima Fecha de Facturación</FormLabel>
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
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
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
                  <Textarea placeholder="Describe la marca, valores, público objetivo, tono deseado, etc." className="resize-y min-h-[100px]" {...field} />
                </FormControl>
                <FormDescription>Esta información ayudará a generar mejores sugerencias de contenido.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <h2 className="text-xl font-semibold border-b pb-2 mt-6">Detalles Adicionales de Servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="serviciosActivosGeneral"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servicios Activos Generales (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Marketing digital completo, SEO local, campañas en Google Ads" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviciosContratadosAdicionales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Otros Servicios Contratados (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Diseño gráfico para eventos, consultoría estratégica trimestral" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    <Input placeholder="Ej: www.sonrisas.com" {...field} />
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
                    <Input placeholder="Ej: Hosting Compartido Pro" {...field} />
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

          <h2 className="text-xl font-semibold border-b pb-2 mt-6">Redes Sociales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="plataformasRedesSociales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plataformas (Separadas por coma, Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Instagram, Facebook, LinkedIn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="detallesRedesSociales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalles/Estrategia Redes Sociales (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Objetivos, tipo de contenido, frecuencia..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="configuracionRedesSociales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuración Adicional RRSS (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Herramientas conectadas, accesos especiales..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="credencialesRedesUsuario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario Credenciales RRSS (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Usuario genérico o específico" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credencialesRedesContrasena"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña Credenciales RRSS (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Contraseña segura" {...field} />
                  </FormControl>
                   <FormDescription>Almacenar de forma segura. Considerar gestor de contraseñas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <h2 className="text-xl font-semibold border-b pb-2 mt-6">Otros</h2>
          <FormField
            control={form.control}
            name="notas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Cualquier otra información relevante sobre el cliente." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
            {form.formState.isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
