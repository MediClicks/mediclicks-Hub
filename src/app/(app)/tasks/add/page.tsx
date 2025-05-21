
'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { TaskPriority, TaskStatus, Client, WithConvertedDates } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, Timestamp, deleteField, doc, updateDoc, FieldValue } from 'firebase/firestore';

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

  useEffect(() => {
    const fetchClients = async () => {
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
        setClientError('No se pudieron cargar los clientes para el selector.');
        toast({
          title: 'Error al Cargar Clientes',
          description: 'No se pudieron cargar los clientes. Intenta recargar.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchClients();
  }, [toast]);

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
       combinedAlertDate = new Date(data.alertDate);
       combinedAlertDate.setHours(0, 0, 0, 0); // Default to start of day if no time selected
    }

    try {
      let clientName: string | undefined = undefined;
      if (data.clientId && data.clientId !== TASK_CLIENT_SELECT_NONE_VALUE) {
        clientName = clientsList.find(c => c.id === data.clientId)?.name;
      }

      // Correctly construct taskDataToSave
      const taskDataToSave: any = {
        ...data, // Spread form data
        clientName: clientName, // Add or override clientName
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // dueDate and alertDate will be handled next
      };

      // Convert JS Dates from form to Firestore Timestamps or use deleteField
      taskDataToSave.dueDate = Timestamp.fromDate(data.dueDate);
      
      if (combinedAlertDate) {
        taskDataToSave.alertDate = Timestamp.fromDate(combinedAlertDate);
      } else {
        taskDataToSave.alertDate = deleteField(); 
      }
      
      if (!data.clientId || data.clientId === TASK_CLIENT_SELECT_NONE_VALUE) {
        taskDataToSave.clientId = deleteField();
        taskDataToSave.clientName = deleteField(); 
      } else {
         taskDataToSave.clientId = data.clientId; 
      }

      if (taskDataToSave.description === undefined || taskDataToSave.description === '') {
        taskDataToSave.description = deleteField();
      }
      
      const docRef = await addDoc(collection(db, 'tasks'), taskDataToSave);

      // Add alertFired field, only if alertDate was provided and saved (is a Timestamp)
      if (taskDataToSave.alertDate && !(taskDataToSave.alertDate instanceof FieldValue) ) { 
          await updateDoc(doc(db, 'tasks', docRef.id), { alertFired: false });
      }
      
      console.log('Nueva tarea guardada en Firestore con ID: ', docRef.id);

      toast({
        title: 'Tarea Creada',
        description: `La tarea "${data.name}" ha sido agregada exitosamente.`,
      });
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
                  <Textarea placeholder="Detalles adicionales sobre la tarea..." {...field} />
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
                    disabled={isLoadingClients || !!clientError}
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
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es }) + (selectedAlertTime ? ` ${selectedAlertTime}` : ' (00:00)')
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
                        onSelect={(date) => field.onChange(date || null)} 
                        initialFocus
                        locale={es}
                      />
                      <div className="p-3 border-t">
                        <Select value={selectedAlertTime} onValueChange={setSelectedAlertTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar hora (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={undefined}>Sin hora específica (00:00)</SelectItem>
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
         </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={form.formState.isSubmitting || isLoadingClients}>
              {form.formState.isSubmitting ? 'Guardando Tarea...' : 'Guardar Tarea'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

