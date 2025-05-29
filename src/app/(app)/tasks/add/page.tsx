
'use client';

import { useEffect, useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import{
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';;
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { TaskPriority, TaskStatus, Client, WithConvertedDates } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, Timestamp, deleteField, FieldValue } from 'firebase/firestore';
import { addCalendarEventForTaskAction } from '@/app/actions/calendarActions';


const taskPriorities: TaskPriority[] = ['Baja', 'Media', 'Alta'];
const taskStatuses: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completada'];

const taskFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre de la tarea debe tener al menos 3 caracteres.' }),
  description: z.string().optional(),
  assignedTo: z.string().min(2, { message: 'Debe asignar la tarea a alguien.' }),
  clientId: z.string().optional(),
  dueDate: z.date({ required_error: 'La fecha de vencimiento es obligatoria.' }),
  priority: z.enum(taskPriorities, { required_error: 'La prioridad es obligatoria.' }),
  status: z.enum(taskStatuses, { required_error: 'El estado es obligatorio.' }),
  alertDate: z.date().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

function convertClientTimestampsToDates(docData: any): WithConvertedDates<Client> {
  const data = { ...docData } as Partial<WithConvertedDates<Client>>;
  for (const key in data) {
    if (data[key as keyof Client] instanceof Timestamp) {
      data[key as keyof Client] = (data[key as keyof Client] as Timestamp).toDate() as any;
    }
  }
  return data as WithConvertedDates<Client>;
}

const TASK_CLIENT_SELECT_NONE_VALUE = "__NONE__";

export default function AddTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [clientsList, setClientsList] = useState<WithConvertedDates<Client>[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}`;
  });

  const [selectedAlertTime, setSelectedAlertTime] = useState<string | undefined>(undefined);

  const fetchClients = useCallback(async () => {
    setIsLoadingClients(true);
    setClientError(null);
    try {
      const clientsCollection = collection(db, "clients");
      const q = query(clientsCollection, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedClients = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const convertedData = convertClientTimestampsToDates(data as Client);
        return { id: docSnap.id, ...convertedData };
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
    fetchClients();
  }, [fetchClients]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '',
      assignedTo: '',
      priority: 'Media',
      status: 'Pendiente',
      clientId: TASK_CLIENT_SELECT_NONE_VALUE,
      description: '',
      alertDate: null,
    },
  });

  async function onSubmit(data: TaskFormValues) {
    form.clearErrors();

    let combinedAlertDate: Date | null | undefined = data.alertDate;
    if (data.alertDate && selectedAlertTime) {
      const [hours, minutes] = selectedAlertTime.split(':').map(Number);
      combinedAlertDate = new Date(data.alertDate);
      combinedAlertDate.setHours(hours, minutes, 0, 0);
    } else if (data.alertDate && !selectedAlertTime) {
       combinedAlertDate = startOfDay(new Date(data.alertDate));
    }

    try {
      const taskDataToSave: Record<string, any | FieldValue> = {
        name: data.name,
        assignedTo: data.assignedTo,
        dueDate: Timestamp.fromDate(data.dueDate),
        priority: data.priority,
        status: data.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (data.description && data.description.trim() !== '') {
        taskDataToSave.description = data.description;
      } else {
        taskDataToSave.description = deleteField();
      }

      if (data.clientId && data.clientId !== TASK_CLIENT_SELECT_NONE_VALUE) {
        taskDataToSave.clientId = data.clientId;
        const clientName = clientsList.find(c => c.id === data.clientId)?.name;
        if (clientName) {
          taskDataToSave.clientName = clientName;
        }
      } else {
        taskDataToSave.clientId = deleteField();
        taskDataToSave.clientName = deleteField();
      }
      
      if (combinedAlertDate instanceof Date && !isNaN(combinedAlertDate.getTime())) {
        taskDataToSave.alertDate = Timestamp.fromDate(combinedAlertDate);
        taskDataToSave.alertFired = false; 
      } else {
        taskDataToSave.alertDate = deleteField();
        taskDataToSave.alertFired = deleteField();
      }
      
      const docRef = await addDoc(collection(db, 'tasks'), taskDataToSave);
      // console.log('Nueva tarea guardada con ID: ', docRef.id); // Removed debug log

      toast({
        title: 'Tarea Creada',
        description: `La tarea "${data.name}" ha sido agregada exitosamente.`,
      });

      // Attempt to create Google Calendar event if alertDate is set
      if (taskDataToSave.alertDate && taskDataToSave.alertDate instanceof Timestamp) {
          const calendarResult = await addCalendarEventForTaskAction({
            name: taskDataToSave.name,
            description: taskDataToSave.description instanceof FieldValue ? undefined : taskDataToSave.description, 
            alertDate: taskDataToSave.alertDate.toDate(), // Convert Timestamp back to Date for the action
          });
          if (calendarResult.success) {
            toast({
              title: "Evento de Calendario Creado",
              description: "La alerta de la tarea se agregó a Google Calendar.",
              duration: 4000,
            });
          } else {
            toast({
              title: "Error al Crear Evento de Calendario",
              description: calendarResult.error || "No se pudo agregar la alerta a Google Calendar. Revisa la configuración y el archivo token.json.",
              variant: "destructive",
              duration: 7000,
            });
          }
      }

      router.push('/tasks');
    } catch (e) {
      console.error('Error al agregar tarea a Firestore: ', e);
      toast({
        title: 'Error al Guardar Tarea',
        description: 'Hubo un problema al guardar la tarea. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Agregar Nueva Tarea</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Tarea</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Diseñar banners para campaña X" {...field} disabled={form.formState.isSubmitting}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalles adicionales sobre la tarea..." {...field} value={field.value ?? ''} disabled={form.formState.isSubmitting}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignada A</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Pérez" {...field} disabled={form.formState.isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente (Opcional)</FormLabel>
                  <Select
                    value={field.value || TASK_CLIENT_SELECT_NONE_VALUE}
                    onValueChange={(selectedValue) => {
                      field.onChange(selectedValue === TASK_CLIENT_SELECT_NONE_VALUE ? undefined : selectedValue);
                    }}
                    disabled={isLoadingClients || !!clientError || form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingClients ? "Cargando clientes..." : (clientError ? "Error al cargar clientes" : "Seleccionar un cliente")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientError && <div className="p-2 text-sm text-destructive flex items-center"><AlertTriangle className="h-4 w-4 mr-2" /> {clientError}</div>}
                      {!clientError && <SelectItem value={TASK_CLIENT_SELECT_NONE_VALUE}>Ninguno</SelectItem>}
                      {!isLoadingClients && !clientError && clientsList.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={form.formState.isSubmitting}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
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
                        disabled={form.formState.isSubmitting}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alertDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha y Hora de Alerta (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={form.formState.isSubmitting}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es }) + (selectedAlertTime ? ` ${selectedAlertTime}` : ' (00:00)')
                          ) : (
                            <span>Seleccionar fecha y hora</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                            field.onChange(date || null);
                             if (!date) setSelectedAlertTime(undefined); 
                        }}
                        initialFocus
                        locale={es}
                        disabled={form.formState.isSubmitting}
                      />
                      <div className="p-3 border-t">
                        <Select
                          value={selectedAlertTime}
                          onValueChange={setSelectedAlertTime}
                          disabled={!field.value || form.formState.isSubmitting} 
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar hora (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={undefined as any}>Sin hora específica (00:00)</SelectItem>
                            {timeOptions.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={form.formState.isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {taskPriorities.map(priority => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
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
                      {taskStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
         </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={form.formState.isSubmitting || isLoadingClients}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {form.formState.isSubmitting ? 'Guardando Tarea...' : 'Guardar Tarea'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
