
'use client';

import { useEffect, useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, getHours, getMinutes, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { TaskPriority, TaskStatus, Client, WithConvertedDates, Task } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp, collection, query, orderBy, getDocs, deleteField, FieldValue } from 'firebase/firestore';

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
  alertFired: z.boolean().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TASK_CLIENT_SELECT_NONE_VALUE = "__NONE__";

function convertClientTimestampsToDates(docData: any): WithConvertedDates<Client> {
  const data = { ...docData } as Partial<WithConvertedDates<Client>>;
  for (const key in data) {
    if (data[key as keyof Client] instanceof Timestamp) {
      data[key as keyof Client] = (data[key as keyof Client] as Timestamp).toDate() as any;
    }
  }
  return data as WithConvertedDates<Client>;
}

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const taskId = params.id as string;

  const [isLoadingForm, setIsLoadingForm] = useState(true); // Combined loading state
  const [taskNotFound, setTaskNotFound] = useState(false);
  const [clientsList, setClientsList] = useState<WithConvertedDates<Client>[]>([]);
  // const [isLoadingClients, setIsLoadingClients] = useState(true); // Covered by isLoadingForm
  const [clientError, setClientError] = useState<string | null>(null);

  const [selectedAlertTime, setSelectedAlertTime] = useState<string | undefined>(undefined);

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}`;
  });

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '',
      description: '',
      assignedTo: '',
      priority: 'Media',
      status: 'Pendiente',
      clientId: TASK_CLIENT_SELECT_NONE_VALUE,
      alertDate: null,
      alertFired: false,
    },
  });

  const fetchTaskAndClients = useCallback(async () => {
    if (!taskId) {
      setTaskNotFound(true);
      setIsLoadingForm(false);
      toast({ title: 'Error', description: 'ID de tarea no válido.', variant: 'destructive' });
      router.push('/tasks');
      return;
    }

    setIsLoadingForm(true);
    setTaskNotFound(false);
    setClientError(null);

    try {
      // Fetch Clients
      const clientsCollection = collection(db, "clients");
      const qClients = query(clientsCollection, orderBy("name", "asc"));
      const clientsSnapshot = await getDocs(qClients);
      const fetchedClients = clientsSnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...convertClientTimestampsToDates(data as Client) };
      });
      setClientsList(fetchedClients);

      // Fetch Task
      const taskDocRef = doc(db, 'tasks', taskId);
      const docSnap = await getDoc(taskDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Task;
        let initialAlertTime: string | undefined = undefined;
        let initialAlertDate: Date | null = null;

        if (data.alertDate && data.alertDate instanceof Timestamp) {
          const alertDateObj = data.alertDate.toDate();
          initialAlertDate = alertDateObj;
          const hours = String(getHours(alertDateObj)).padStart(2, '0');
          const minutes = String(getMinutes(alertDateObj)).padStart(2, '0');
          initialAlertTime = `${hours}:${minutes}`;
        }
        setSelectedAlertTime(initialAlertTime);

        form.reset({
          name: data.name || '',
          description: data.description || '',
          assignedTo: data.assignedTo || '',
          clientId: data.clientId || TASK_CLIENT_SELECT_NONE_VALUE,
          dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : new Date()),
          priority: data.priority,
          status: data.status,
          alertDate: initialAlertDate,
          alertFired: data.alertFired || false,
        });
      } else {
        setTaskNotFound(true);
        toast({ title: 'Error', description: 'Tarea no encontrada.', variant: 'destructive' });
        router.push('/tasks');
      }
    } catch (error) {
      console.error("Error fetching task or clients: ", error);
      toast({ title: 'Error', description: 'No se pudo cargar la información de la tarea o los clientes.', variant: 'destructive' });
      // Potentially set specific error for clients if that part failed
      if (clientsList.length === 0) setClientError('No se pudieron cargar los clientes.');
    } finally {
      setIsLoadingForm(false);
    }
  }, [taskId, form, router, toast, clientsList.length]); // Added clientsList.length to dependencies

  useEffect(() => {
    fetchTaskAndClients();
  }, [fetchTaskAndClients]);


  async function onSubmit(data: TaskFormValues) {
    form.clearErrors();

    let combinedAlertDate: Date | null | undefined = data.alertDate;
    if (data.alertDate && selectedAlertTime) {
      const [hours, minutes] = selectedAlertTime.split(':').map(Number);
      combinedAlertDate = new Date(data.alertDate); // Create a new Date object from the form's date part
      combinedAlertDate.setHours(hours, minutes, 0, 0); // Set the time
    } else if (data.alertDate && !selectedAlertTime) { // If date is set but no time, default to start of day
        combinedAlertDate = startOfDay(new Date(data.alertDate));
    }


    try {
      const taskDocRef = doc(db, 'tasks', taskId);

      let clientName: string | undefined = undefined;
      if (data.clientId && data.clientId !== TASK_CLIENT_SELECT_NONE_VALUE) {
        clientName = clientsList.find(c => c.id === data.clientId)?.name;
      }

      const dataToUpdate: Record<string, any> = {
        name: data.name,
        assignedTo: data.assignedTo,
        dueDate: Timestamp.fromDate(data.dueDate),
        priority: data.priority,
        status: data.status,
        updatedAt: serverTimestamp(),
      };

      if (data.description && data.description.trim() !== '') {
        dataToUpdate.description = data.description;
      } else {
        dataToUpdate.description = deleteField();
      }

      if (data.clientId && data.clientId !== TASK_CLIENT_SELECT_NONE_VALUE) {
        dataToUpdate.clientId = data.clientId;
        dataToUpdate.clientName = clientName;
      } else {
        dataToUpdate.clientId = deleteField();
        dataToUpdate.clientName = deleteField();
      }

      if (combinedAlertDate instanceof Date && !isNaN(combinedAlertDate.getTime())) {
        dataToUpdate.alertDate = Timestamp.fromDate(combinedAlertDate);
        dataToUpdate.alertFired = false; // Reset alertFired when alertDate is set/changed
      } else {
        dataToUpdate.alertDate = deleteField();
        dataToUpdate.alertFired = deleteField();
      }

      await updateDoc(taskDocRef, dataToUpdate);

      toast({
        title: 'Tarea Actualizada',
        description: `La tarea "${data.name}" ha sido actualizada exitosamente.`,
      });
      router.push('/tasks');
    } catch (e) {
      console.error('Error al actualizar tarea en Firestore: ', e);
      toast({
        title: 'Error al Guardar Tarea',
        description: 'Hubo un problema al actualizar la tarea. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    }
  }

  if (isLoadingForm) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando datos de la tarea...</p>
      </div>
    );
  }

  if (taskNotFound) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Tarea no Encontrada</h1>
        <p className="text-muted-foreground">La tarea que intentas editar no existe o no se pudo encontrar.</p>
        <Button onClick={() => router.push('/tasks')} className="mt-4">Volver a Tareas</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Editar Tarea: {form.watch('name')}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Tarea</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Diseñar banners para campaña X" {...field} />
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
                  <Textarea placeholder="Detalles adicionales sobre la tarea..." {...field} value={field.value || ''} />
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
                    <Input placeholder="Ej: Juan Pérez" {...field} />
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
                    disabled={clientsList.length === 0 && !clientError}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={clientError ? "Error al cargar clientes" : (clientsList.length === 0 ? "No hay clientes" : "Seleccionar un cliente")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientError && <div className="p-2 text-sm text-destructive flex items-center"><AlertTriangle className="h-4 w-4 mr-2" /> {clientError}</div>}
                      {!clientError && <SelectItem value={TASK_CLIENT_SELECT_NONE_VALUE}>Ninguno</SelectItem>}
                      {!clientError && clientsList.map(client => (
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
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
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
              name="alertDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha y Hora de Alerta (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es }) + (selectedAlertTime ? ` ${selectedAlertTime}` : '')
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
                            if (!date) setSelectedAlertTime(undefined); // Clear time if date is cleared
                        }}
                        initialFocus
                        locale={es}
                      />
                      <div className="p-3 border-t">
                        <Select 
                          value={selectedAlertTime} 
                          onValueChange={setSelectedAlertTime} 
                          disabled={!field.value} // Disable time if no date is selected
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Hora (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={undefined as any}>Sin hora específica</SelectItem>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
            {form.watch('alertDate') && (
                 <FormItem className="md:col-span-1 flex flex-col justify-end pb-2">
                    <p className="text-xs text-muted-foreground">
                        Alerta disparada: {form.watch('alertFired') ? 'Sí' : 'No'}
                    </p>
                 </FormItem>
            )}
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting || isLoadingForm}>
            {form.formState.isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
