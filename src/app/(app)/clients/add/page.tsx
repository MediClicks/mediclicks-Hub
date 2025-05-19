'use client';

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
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
// import { mockClients, commonServices } from '@/lib/data'; // To add a new client, not needed here for now
// import type { Client, Service } from '@/types';

// Define Zod schema for client form validation
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
  vencimientoWeb: z.date().optional(),
  plataformasRedesSociales: z.string().optional(),
  detallesRedesSociales: z.string().optional(),
  serviciosContratadosAdicionales: z.string().optional(),
  configuracionRedesSociales: z.string().optional(),
  credencialesRedesUsuario: z.string().optional(),
  credencialesRedesContrasena: z.string().optional(),
  // services: z.array(z.string()).optional(), // For structured services if using multi-select
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function AddClientPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      email: '',
      pagado: false,
      // contractStartDate and nextBillingDate will be Date objects
    },
  });

  function onSubmit(data: ClientFormValues) {
    console.log('Nuevo cliente:', data);
    // Here you would typically send data to your backend
    // For demo, we'll just show a toast and redirect
    toast({
      title: 'Cliente Creado',
      description: `El cliente ${data.name} ha sido agregado exitosamente.`,
    });
    // mockClients.push({ id: `c${mockClients.length + 1}`, ...data, services: [] }); // Example, adapt properly
    router.push('/clients');
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Agregar Nuevo Cliente</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                  <FormLabel>Nombre de la Clínica (si aplica)</FormLabel>
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
                  <FormLabel>Teléfono</FormLabel>
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
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                        locale={es}
                      />
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
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="profileSummary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resumen del Perfil del Cliente (para IA)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe la marca, valores, público objetivo, tono deseado, etc."
                    className="resize-y min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Esta información ayudará a generar mejores sugerencias de contenido.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <h2 className="text-xl font-semibold border-b pb-2">Detalles Adicionales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="serviciosActivosGeneral"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servicios Activos Generales (Descripción)</FormLabel>
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
                  <FormLabel>Otros Servicios Contratados (Descripción)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Diseño gráfico para eventos, consultoría estratégica trimestral" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <h2 className="text-xl font-semibold border-b pb-2">Información Web</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="dominioWeb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dominio Web</FormLabel>
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
                  <FormLabel>Tipo de Servicio Web (Hosting, etc.)</FormLabel>
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
                  <FormLabel>Vencimiento Servicio Web</FormLabel>
                   <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <h2 className="text-xl font-semibold border-b pb-2">Redes Sociales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="plataformasRedesSociales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plataformas (Separadas por coma)</FormLabel>
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
                  <FormLabel>Detalles/Estrategia Redes Sociales</FormLabel>
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
                  <FormLabel>Configuración Adicional RRSS</FormLabel>
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
                  <FormLabel>Usuario Credenciales RRSS (si se comparten)</FormLabel>
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
                  <FormLabel>Contraseña Credenciales RRSS</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Contraseña segura" {...field} />
                  </FormControl>
                   <FormDescription>Almacenar de forma segura. Considerar gestor de contraseñas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="notas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Adicionales</FormLabel>
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
